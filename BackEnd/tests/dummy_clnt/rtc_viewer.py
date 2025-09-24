import asyncio
import json
import logging
import cv2
import queue
import threading
import socketio
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceServer, RTCConfiguration
from av import VideoFrame

from web.schemas.socket_event import ConnectEvents
from web.schemas.socket_event import WebRTCEvents

# --- 설정 (Configuration) ---
# 서버 주소, 인증용 JWT, 영상 스트림을 식별하기 위한 Senior ID를 설정합니다.
# 프론트엔드에서도 동일한 개념의 설정이 필요합니다.
SERVER_URL = "https://j13a503.p.ssafy.io"
JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGFmZl9pZCI6MywiZW1haWwiOiJmaXJzdG1pbndvbzYxQGdtYWlsLmNvbSIsImV4cCI6MTc1ODY1MDk0MiwiaWF0IjoxNzU4NjA3NzQyfQ.Pj2W5hM35-Zqyel20Csh1zCchLR704pw9QGAzFOPJd8"
SENIOR_ID_TO_VIEW = 17 # 시청하고자 하는 Senior의 고유 ID

# --- 로깅 설정 ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("broadcaster")

# --- 전역 변수 ---
# 비동기 Socket.IO 클라이언트 인스턴스를 생성합니다.
sio = socketio.AsyncClient(logger=True, engineio_logger=True)
# WebRTC 피어 연결을 위한 RTCPeerConnection 객체를 생성합니다.
# STUN/TURN 서버 설정은 NAT 환경에서도 P2P 연결을 가능하게 합니다.
pc = RTCPeerConnection(
    RTCConfiguration(
        iceServers=[
            RTCIceServer(urls=["stun:stun.l.google.com:19302"]),
            RTCIceServer(
                urls=[
                    "turns:j13a503.p.ssafy.io:5349?transport=tcp",
                    "turn:j13a503.p.ssafy.io:3478?transport=udp",
                ],
                username="SST_ROOT",
                credential="0olB5NVMTkCpWUnw",
            ),
        ]
    )
)
# 수신된 비디오 프레임을 처리하기 위한 큐
frame_queue = queue.Queue()
# 프로그램 종료를 제어하기 위한 이벤트 객체
stop_event = threading.Event()

# --- OpenCV 영상 출력 스레드 ---
def opencv_display_thread():
    """
    별도의 스레드에서 OpenCV를 사용하여 영상 스트림을 화면에 표시합니다.
    이 부분은 Python 클라이언트에 특화된 처리 로직입니다.
    """
    while not stop_event.is_set():
        try:
            frame = frame_queue.get(timeout=1)
            if frame is None:
                break
            img = frame.to_ndarray(format="bgr24")
            cv2.imshow(f"Viewer (Senior ID: {SENIOR_ID_TO_VIEW})", img)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                stop_event.set()
                break
        except queue.Empty:
            continue
    print("Closing OpenCV window.")
    cv2.destroyAllWindows()

# --- Socket.IO 이벤트 핸들러 ---
# Socket.IO 및 WebRTC 시그널링 순서:
# 1. (Viewer -> Server) connect & AUTHENTICATE
# 2. (Viewer -> Server) CHECK_OFFER: 특정 Senior의 영상 스트림(Offer) 요청
# 3. (Server -> Viewer) NEW_OFFER: Broadcaster(로봇)가 생성한 Offer 전달
# 4. (Viewer -> Server) SEND_ANSWER: Viewer가 생성한 Answer를 서버에 전달
# 5. (양방향) SEND_ICE_CANDIDATE: 각 Peer(Viewer, Broadcaster)가 생성한 ICE Candidate를 서로 교환

@sio.event
async def connect():
    """
    Socket.IO 서버에 성공적으로 연결되었을 때 호출됩니다.
    연결 후, JWT를 이용해 인증하고 시청하려는 Senior의 Offer를 서버에 요청합니다.
    """
    print(f"서버에 연결되었습니다. (sid: {sio.sid})")
    print(f"Senior ID {SENIOR_ID_TO_VIEW}의 Offer를 서버에 요청합니다...")
    try:
        # 1. 서버에 연결이 완료되면, 인증 이벤트를 전송합니다.
        await sio.emit(ConnectEvents.AUTHENTICATE, {'jwt': JWT})
        logger.info("인증 정보를 서버로 전송했습니다.")
    except Exception as e:
        logger.error(f"인증 정보 전송 중 오류 발생: {e}")
    
    # 2. 인증 후, 특정 Senior ID의 WebRTC Offer가 있는지 서버에 확인을 요청합니다.
    #    프론트엔드에서는 사용자가 시청할 채널을 선택하면 이 이벤트를 발생시킵니다.
    await sio.emit(WebRTCEvents.CHECK_OFFER, SENIOR_ID_TO_VIEW)

@sio.event
async def disconnect():
    """서버와의 연결이 끊어졌을 때 호출됩니다."""
    print("서버와의 연결이 끊어졌습니다.")
    if not stop_event.is_set():
        stop_event.set()

@sio.on(WebRTCEvents.NEW_OFFER)
async def on_new_offer(offer_data):
    """
    서버로부터 Broadcaster(로봇)의 Offer(SDP)를 수신했을 때 호출됩니다.
    이 Offer는 WebRTC 연결을 시작하기 위한 세션 정보입니다.
    """
    if not offer_data:
        print(f"Senior ID {SENIOR_ID_TO_VIEW}에 대한 Offer가 아직 없습니다. 10초 후 다시 시도합니다.")
        await asyncio.sleep(10)
        await sio.emit(WebRTCEvents.CHECK_OFFER, SENIOR_ID_TO_VIEW)
        return

    try:
        # 3. 서버로부터 받은 JSON 형식의 Offer 데이터를 파싱합니다.
        offer_dict = json.loads(offer_data)
        print("Offer를 수신했습니다. Answer를 생성합니다...")
        offer = RTCSessionDescription(sdp=offer_dict["sdp"], type=offer_dict["type"])
        
        # 수신한 Offer를 remote description으로 설정합니다.
        await pc.setRemoteDescription(offer)
        
        # Offer에 대한 Answer를 생성합니다.
        answer = await pc.createAnswer()
        # 생성한 Answer를 local description으로 설정합니다.
        await pc.setLocalDescription(answer)
        
        answer_data = {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
        
        print("생성된 Answer를 서버로 전송합니다...")
        # 4. 생성된 Answer를 서버를 통해 Broadcaster에게 전달합니다.
        #    프론트엔드에서도 동일하게 Answer를 생성하여 이 이벤트로 서버에 전송해야 합니다.
        await sio.emit(WebRTCEvents.SEND_ANSWER, (SENIOR_ID_TO_VIEW, answer_data))
    except Exception as e:
        print(f"Offer 처리 중 오류 발생: {e}")
        stop_event.set()

@sio.on(WebRTCEvents.NEW_ICE_CANDIDATE)
async def on_ice_candidate(candidate_data):
    """
    서버를 통해 상대 피어(Broadcaster)로부터 ICE Candidate를 수신했을 때 호출됩니다.
    ICE Candidate는 두 피어 간의 최적의 통신 경로를 찾는 데 사용됩니다.
    """
    try:
        # 5. 수신된 ICE Candidate를 RTCPeerConnection에 추가하여 연결 경로를 설정합니다.
        print(f"상대방 ICE Candidate 수신: {candidate_data.get('candidate')[:30]}...")
        candidate = RTCSessionDescription(
            sdp=candidate_data["sdp"], type=candidate_data["type"]
        )
        await pc.addIceCandidate(candidate)
    except Exception as e:
        print(f"ICE Candidate 추가 중 오류 발생: {e}")

# --- aiortc 이벤트 핸들러 ---
@pc.on("icecandidate")
def on_icecandidate(candidate):
    """
    로컬 RTCPeerConnection에서 ICE Candidate가 생성되었을 때 호출됩니다.
    생성된 Candidate는 시그널링 서버를 통해 상대 피어에게 전달해야 합니다.
    """
    if candidate:
        # 5. 생성된 로컬 ICE Candidate를 서버로 전송합니다.
        #    프론트엔드에서도 이 이벤트 리스너를 통해 생성된 Candidate를 서버로 보내야 합니다.
        print(f"내 ICE Candidate 생성: {candidate.candidate[:30]}...")
        asyncio.create_task(
            sio.emit(WebRTCEvents.SEND_ICE_CANDIDATE, (SENIOR_ID_TO_VIEW, candidate.to_dict()))
        )

@pc.on("track")
def on_track(track):
    """
    WebRTC 연결이 성공적으로 수립되고, 상대 피어(Broadcaster)로부터
    미디어 트랙(비디오 또는 오디오)을 수신했을 때 호출됩니다.
    """
    print(f"Track {track.kind} 수신. 영상 출력을 시작합니다.")
    if track.kind == "video":
        # 프론트엔드에서는 이 시점에서 수신한 track을 <video> 요소의 srcObject에 할당하여
        # 스트리밍 영상을 화면에 표시합니다.
        asyncio.ensure_future(display_track(track))

async def display_track(track):
    """수신한 비디오 트랙의 각 프레임을 큐에 추가합니다."""
    while not stop_event.is_set():
        try:
            frame = await track.recv()
            frame_queue.put(frame)
        except Exception:
            break
    print("Video track reception ended.")

@pc.on("connectionstatechange")
async def on_connectionstatechange():
    """PeerConnection의 연결 상태가 변경될 때마다 호출됩니다."""
    print(f"PeerConnection 상태 변경: {pc.connectionState}")
    if pc.connectionState == "failed":
        print("PeerConnection 연결 실패.")
        if not stop_event.is_set():
            stop_event.set()

# --- 메인 실행 함수 ---
async def main():
    """프로그램의 메인 로직을 실행합니다."""
    # OpenCV GUI를 위한 별도 스레드를 시작합니다.
    thread = threading.Thread(target=opencv_display_thread)
    thread.start()

    try:
        # Socket.IO 서버에 연결합니다.
        await sio.connect(SERVER_URL, transports=["websocket"])
        # 사용자가 'q'를 누르거나 연결이 끊길 때까지 메인 루프를 유지합니다.
        await asyncio.get_event_loop().run_in_executor(None, stop_event.wait)
    except Exception as e:
        print(f"메인 루프에서 오류 발생: {e}")
    finally:
        # 프로그램 종료 시 모든 리소스를 정리합니다.
        print("종료를 시작합니다...")
        if not stop_event.is_set():
            stop_event.set() 
        
        if pc.connectionState != "closed":
            await pc.close()

        if sio.connected:
            await sio.disconnect()
        
        frame_queue.put(None) 
        thread.join()
        print("모든 리소스 정리 완료.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n프로그램 강제 종료.")
    finally:
        if not stop_event.is_set():
            stop_event.set()