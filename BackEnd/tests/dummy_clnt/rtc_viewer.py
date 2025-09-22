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
# ❓연결할 서버의 주소와 시청할 Senior ID를 입력하세요.
SERVER_URL = "https://j13a503.p.ssafy.io"
JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGFmZl9pZCI6MywiZW1haWwiOiJmaXJzdG1pbndvbzYxQGdtYWlsLmNvbSIsImV4cCI6MTc1ODU5ODk1NiwiaWF0IjoxNzU4NTU1NzU2fQ.izVMgAMZzkmgyFK16ETx4XzYUn4utq4cOOfvBpnwLoI"
SENIOR_ID_TO_VIEW = 17 # 예시: 17번 Senior의 영상을 시청

# --- 로깅 설정 ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("broadcaster")

# --- 전역 변수 ---
sio = socketio.AsyncClient(logger=True, engineio_logger=True)
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
frame_queue = queue.Queue()
stop_event = threading.Event()

# --- OpenCV 영상 출력 스레드 (기존 코드와 동일) ---
def opencv_display_thread():
    """OpenCV 창을 표시하고 큐의 프레임을 업데이트하는 스레드 함수"""
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
@sio.event
async def connect():
    print(f"✅ 서버에 연결되었습니다. (sid: {sio.sid})")
    print(f"👀 Senior ID {SENIOR_ID_TO_VIEW}의 Offer를 서버에 요청합니다...")
    # 1. 연결이 완료되면, 시청하려는 Senior의 Offer가 있는지 서버에 확인 요청
    try:
        # 연결이 보장된 이곳에서 인증 정보를 보냅니다.
        await sio.emit(ConnectEvents.AUTHENTICATE, {'jwt': JWT})
        logger.info("🚀 인증 정보를 서버로 전송했습니다.")
    except Exception as e:
        logger.error(f"인증 정보 전송 중 오류 발생: {e}")
    await sio.emit(WebRTCEvents.CHECK_OFFER, SENIOR_ID_TO_VIEW)

@sio.on(ConnectEvents.REQUEST_AUTH)
async def on_request_auth(data=None):
    """
    서버가 보내는 인증 요청은 이제 무시합니다.
    왜냐하면 connect 핸들러에서 우리가 알아서 보낼 것이기 때문입니다.
    """
    logger.info("ℹ️ 서버로부터 인증 요청을 받았지만, connect 핸들러에서 처리하므로 무시합니다.")
    pass # 아무것도 하지 않음

@sio.event
async def disconnect():
    print("❌ 서버와의 연결이 끊어졌습니다.")
    if not stop_event.is_set():
        stop_event.set()

@sio.on(WebRTCEvents.NEW_OFFER)
async def on_new_offer(offer_data):
    """서버로부터 Broadcaster(로봇)의 Offer를 받았을 때 호출"""
    if not offer_data:
        print(f"⚠️ Senior ID {SENIOR_ID_TO_VIEW}에 대한 Offer가 아직 없습니다. 10초 후 다시 시도합니다.")
        await asyncio.sleep(10)
        await sio.emit(WebRTCEvents.CHECK_OFFER, SENIOR_ID_TO_VIEW)
        return

    try:
        # ▼▼▼▼▼ [수정된 부분] ▼▼▼▼▼
        # 서버로부터 받은 JSON 문자열을 파이썬 딕셔너리로 변환합니다.
        offer_dict = json.loads(offer_data)
        # ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        print("📥 Offer를 수신했습니다. Answer를 생성합니다...")
        offer = RTCSessionDescription(sdp=offer_dict["sdp"], type=offer_dict["type"])
        
        await pc.setRemoteDescription(offer)
        
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        
        answer_data = {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
        
        print("📤 생성된 Answer를 서버로 전송합니다...")
        # 2. 생성된 Answer를 서버로 전송
        await sio.emit(WebRTCEvents.SEND_ANSWER, (SENIOR_ID_TO_VIEW, answer_data))
    except Exception as e:
        print(f"🚨 Offer 처리 중 오류 발생: {e}")
        stop_event.set()

@sio.on(WebRTCEvents.SEND_ICE_CANDIDATE)
async def on_ice_candidate(candidate_data):
    """서버로부터 상대방(로봇)의 ICE Candidate를 받았을 때 호출"""
    try:
        print(f"📥 상대방 ICE Candidate 수신: {candidate_data.get('candidate')[:30]}...")
        # 3. 수신된 ICE Candidate를 RTCPeerConnection에 추가
        candidate = RTCSessionDescription(
            sdp=candidate_data["sdp"], type=candidate_data["type"]
        )
        await pc.addIceCandidate(candidate)
    except Exception as e:
        print(f"🚨 ICE Candidate 추가 중 오류 발생: {e}")

# --- aiortc 이벤트 핸들러 ---
@pc.on("icecandidate")
def on_icecandidate(candidate):
    """로컬에서 ICE Candidate가 생성되었을 때 호출"""
    if candidate:
        print(f"📤 내 ICE Candidate 생성: {candidate.candidate[:30]}...")
        # 4. 생성된 내 ICE Candidate를 서버로 전송
        asyncio.create_task(
            sio.emit(WebRTCEvents.SEND_ICE_CANDIDATE, (SENIOR_ID_TO_VIEW, candidate.to_dict()))
        )

@pc.on("track")
def on_track(track):
    """상대방으로부터 비디오/오디오 트랙을 수신했을 때 호출"""
    print(f"➡️ Track {track.kind} 수신. 영상 출력을 시작합니다.")
    if track.kind == "video":
        asyncio.ensure_future(display_track(track))

async def display_track(track):
    while not stop_event.is_set():
        try:
            frame = await track.recv()
            frame_queue.put(frame)
        except Exception:
            break
    print("Video track reception ended.")

@pc.on("connectionstatechange")
async def on_connectionstatechange():
    print(f"PeerConnection 상태 변경: {pc.connectionState}")
    if pc.connectionState == "failed":
        print("❌ PeerConnection 연결 실패.")
        if not stop_event.is_set():
            stop_event.set()

# --- 메인 실행 함수 ---
async def main():
    # OpenCV GUI 스레드 시작
    thread = threading.Thread(target=opencv_display_thread)
    thread.start()

    try:
        await sio.connect(SERVER_URL, transports=["websocket"])
        # stop_event가 설정될 때까지 대기 (사용자가 'q'를 누르거나 연결이 끊길 때까지)
        await asyncio.get_event_loop().run_in_executor(None, stop_event.wait)
    except Exception as e:
        print(f"🚨 메인 루프에서 오류 발생: {e}")
    finally:
        print("종료를 시작합니다...")
        if not stop_event.is_set():
            stop_event.set() # 스레드 종료 신호
        
        if pc.connectionState != "closed":
            await pc.close()

        if sio.connected:
            await sio.disconnect()
        
        frame_queue.put(None) # 디스플레이 스레드 종료 신호
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