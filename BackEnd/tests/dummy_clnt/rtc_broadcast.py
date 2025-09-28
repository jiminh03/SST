'''
WebRTC 방송 송출 클라이언트 (Robot/Hub)

이 스크립트는 python-socketio와 aiortc 라이브러리를 사용하여
Socket.IO 서버에 연결하고, 로컬 카메라의 비디오 스트림을
WebRTC를 통해 방송(Broadcast)합니다.
'''
import asyncio
import logging

import socketio
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCBundlePolicy, VideoStreamTrack, RTCConfiguration, RTCIceServer 
from aiortc.contrib.media import MediaPlayer
from web.schemas.socket_event import ConnectEvents
from web.schemas.socket_event import WebRTCEvents
import cv2
from av import VideoFrame

# --- 설정 ---
# 연결할 시그널링 서버의 주소입니다.
SERVER_ADDRESS = "https://j13a503.p.ssafy.io"
# 서버 인증을 위한 API 키입니다.
API_KEY = "s85t-gaMxTcNPpznJCqa0eXsMT_yjfFuA-slOtIHAnU"
# 이 방송 스트림을 고유하게 식별하기 위한 ID입니다.
# 프론트엔드(Viewer)에서는 이 ID를 사용하여 특정 스트림을 요청하게 됩니다.
SENIOR_ID = 13

# --- 로깅 설정 ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("broadcaster")

# --- 전역 변수 ---
# 비동기 Socket.IO 클라이언트 인스턴스를 생성합니다.
sio = socketio.AsyncClient(logger=True, engineio_logger=True)
# WebRTC 연결을 관리하는 RTCPeerConnection 객체입니다.
pc = RTCPeerConnection()

class CameraStreamTrack(VideoStreamTrack):
    """
    OpenCV를 사용하여 로컬 카메라 영상을 WebRTC 비디오 트랙으로 변환하는 클래스입니다.
    이 클래스가 실제 영상 데이터의 소스 역할을 합니다.
    """
    def __init__(self):
        super().__init__()
        # 시스템의 기본 카메라(0번)를 엽니다.
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            raise Exception("Could not open video camera")
        logger.info("카메라가 성공적으로 열렸습니다.")

    async def recv(self):
        """
        aiortc 라이브러리에 의해 호출되어 다음 비디오 프레임을 반환합니다.
        """
        pts, time_base = await self.next_timestamp()
        ret, frame = self.cap.read()
        if not ret:
            return None

        # OpenCV의 BGR 포맷을 aiortc가 필요로 하는 RGB 포맷으로 변환합니다.
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # NumPy 배열을 aiortc가 사용할 수 있는 VideoFrame 객체로 변환합니다.
        video_frame = VideoFrame.from_ndarray(frame_rgb, format="rgb24")
        video_frame.pts = pts
        video_frame.time_base = time_base
        return video_frame

    def stop(self):
        """카메라 리소스를 해제합니다."""
        if self.cap.isOpened():
            self.cap.release()
            logger.info("카메라가 닫혔습니다.")

# --- Socket.IO 이벤트 핸들러 ---
# [WebRTC 시그널링 순서 - Broadcaster(이 스크립트)와 Viewer(프론트엔드) 기준]
# 1. Broadcaster: 서버 연결 및 API 키로 인증 (ConnectEvents.AUTHENTICATE)
# 2. Broadcaster: 인증 성공 시 WebRTC 연결 절차 시작
# 3. Broadcaster: Offer 생성 후 서버에 등록 (WebRTCEvents.REGISTER_OFFER)
# 4. Viewer: (별도 로직) 서버에 연결 후, 특정 SENIOR_ID의 스트림을 요청
# 5. Viewer: 서버로부터 Broadcaster의 Offer를 수신
# 6. Viewer: Offer를 바탕으로 Answer를 생성하여 서버로 전송
# 7. Broadcaster: 서버로부터 Viewer의 Answer를 수신 (WebRTCEvents.NEW_ANSWER)
# 8. 양측: ICE Candidate를 지속적으로 교환 (SEND_ICE_CANDIDATE, NEW_ICE_CANDIDATE)

@sio.event
async def connect():
    """
    Socket.IO 서버와 연결이 성공적으로 수립되면 호출됩니다.
    연결 후 즉시 인증 절차를 시작합니다.
    """
    logger.info(f"서버에 연결되었습니다. SID: {sio.sid}.")
    await start_webrtc_broadcast()

@sio.event
async def disconnect():
    """서버와의 연결이 끊어졌을 때 호출됩니다."""
    logger.info("서버와의 연결이 끊어졌습니다.")
    if pc and pc.connectionState != "closed":
        await pc.close()

@sio.on(WebRTCEvents.NEW_ANSWER)
async def on_new_answer(data):
    """
    7. Viewer(프론트엔드)가 생성한 Answer를 서버를 통해 수신했을 때 호출됩니다.
    이 Answer SDP를 remote description으로 설정하여 연결을 계속 진행합니다.
    """
    logger.info("[Answer 수신] FE로부터 Answer를 받았습니다.")
    if pc and pc.signalingState != "closed":
        try:
            answer = RTCSessionDescription(sdp=data["sdp"], type=data["type"])
            await pc.setRemoteDescription(answer)
            logger.info("Remote Description 설정 완료 (Answer)")
        except Exception as e:
            logger.error(f"Answer 처리 중 오류 발생: {e}")

@sio.on(WebRTCEvents.NEW_ICE_CANDIDATE)
async def on_ice_candidate(data):
    """
    8. Viewer로부터 새로운 ICE Candidate를 수신했을 때 호출됩니다.
    수신된 Candidate는 P2P 연결 경로를 설정하는 데 사용됩니다.
    """
    logger.info(f"[ICE 수신] FE로부터 ICE Candidate를 받았습니다.")
    if pc and data and data.get("candidate"):
        try:
            print(data.get("candidate"))
            # candidate = RTCIceCandidate(
            #     sdpMid=data.get("sdpMid"),
            #     sdpMLineIndex=data.get("sdpMLineIndex"),
            #     candidate=data.get("candidate"),
            # )
            # await pc.addIceCandidate(candidate)
            logger.info("ICE Candidate 추가 완료")
        except Exception as e:
            logger.error(f"ICE Candidate 처리 중 오류 발생: {e}")

# --- WebRTC 관련 함수 ---

async def start_webrtc_broadcast():
    """
    WebRTC PeerConnection을 초기화하고, Offer를 생성하여 서버에 전송하는
    전체적인 방송 시작 과정을 담당합니다.
    """
    global pc
    if pc.connectionState != "closed":
        await pc.close()

    config = RTCConfiguration(
        iceServers=[
            RTCIceServer(urls=["stun:stun.l.google.com:19302"]),
            RTCIceServer(
                urls=[
                    "turns:j13a503.p.ssafy.io:5349?transport=tcp",
                    "turn:j13a503.p.ssafy.io:3478?transport=udp",
                ],
                username="SST_TURN",
                credential="usGqSEnD6Spu8TxC51bUx9j13SCjPSTk",
            ),
        ], 
    )
    pc = RTCPeerConnection(configuration=config)

    # --- 👇 이 부분이 추가되었습니다 ---

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        """RTCPeerConnection의 연결 상태가 변경될 때마다 호출됩니다."""
        logger.info(f"Connection state is -> {pc.connectionState}")
        
        # 연결이 성공적으로 수립되었을 때
        if pc.connectionState == "connected":
            # SCTP(데이터 채널) 트랜스포트에서 선택된 ICE 후보 쌍을 가져옵니다.
            # 미디어 트랜스포트도 동일한 ICE 트랜스포트를 사용합니다.
            selected_pair = pc.sctp.transport.transport.getSelectedCandidatePair()
            if selected_pair:
                local_type = selected_pair[0].type
                remote_type = selected_pair[1].type
                logger.info(
                    f"Connection established via: Local({local_type}) <-> Remote({remote_type})"
                )
                
                # 후보 중 하나라도 'relay' 타입이면 TURN 서버를 경유한 것입니다.
                if local_type == 'relay' or remote_type == 'relay':
                    logger.info("✅ This connection is relayed via TURN server.")
                else:
                    logger.info("✅ This is a direct P2P connection (host/srflx).")
    
    # --- ------------------------ ---

    @pc.on("icecandidate")
    async def on_icecandidate(candidate):
        """
        8. 로컬 PeerConnection에서 ICE Candidate가 생성될 때마다 호출됩니다.
        생성된 Candidate를 서버로 전송하여 Viewer에게 전달합니다.
        """
        if candidate:
            logger.info(f"[ICE 생성] ICE Candidate 생성 완료")
            ice_data = {
                "candidate": candidate.candidate,
                "sdpMid": candidate.sdpMid,
                "sdpMLineIndex": candidate.sdpMLineIndex,
            }
            # 프론트엔드는 이 이벤트를 수신하여 addIceCandidate를 호출해야 합니다.
            await sio.emit(
                WebRTCEvents.SEND_ICE_CANDIDATE,
                (SENIOR_ID, ice_data)
            )

    try:
        # 로컬 카메라 트랙을 PeerConnection에 추가합니다.
        # 이 트랙이 Viewer에게 스트리밍될 미디어 소스입니다.
        video_track = CameraStreamTrack()
        pc.addTrack(video_track)
    except Exception as e:
        logger.error(f"카메라 트랙 추가 중 오류 발생: {e}")
        return

    # 3. WebRTC 연결을 제안하는 Offer를 생성합니다.
    offer = await pc.createOffer()
    # 생성된 Offer를 로컬 description으로 설정합니다.
    await pc.setLocalDescription(offer)
    logger.info("Local Description 설정 완료 (Offer)")

    logger.info(f"[Offer 전송] 서버에 Offer를 등록합니다 (senior_id: {SENIOR_ID})")
    offer_data = {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
    # 생성된 Offer를 SENIOR_ID와 함께 서버에 등록합니다.
    # Viewer는 이 SENIOR_ID를 이용해 서버에 저장된 Offer를 요청하게 됩니다.
    await sio.emit(
        WebRTCEvents.REGISTER_OFFER,
        (SENIOR_ID, offer_data)
    )

# --- 메인 실행 로직 ---

async def main():
    """
    메인 비동기 함수. Socket.IO 서버에 연결하고 연결이 종료될 때까지 대기합니다.
    """
    try:
        await sio.connect(
            SERVER_ADDRESS,
            socketio_path='/socket.io',
            auth={'api_key': API_KEY}
        )
        await sio.wait()
    except Exception as e:
        logger.error(f"연결 또는 실행 중 오류 발생: {e}")
    finally:
        if sio.connected:
            await sio.disconnect()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n프로그램을 종료합니다.")