'''
WebRTC 방송 송출 클라이언트 (Robot/Hub Dummy)

이 스크립트는 python-socketio와 aiortc 라이브러리를 사용하여
서버에 연결하고 WebRTC를 통해 비디오 스트림을 방송합니다.
'''
import asyncio
import logging

import socketio
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, VideoStreamTrack
from aiortc.contrib.media import MediaPlayer

from web.schemas.socket_event import ConnectEvents
from web.schemas.socket_event import WebRTCEvents
# ▼▼▼ [추가] OpenCV, AV 라이브러리 import ▼▼▼
import cv2
from av import VideoFrame
# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

# --- 설정 ---
SERVER_ADDRESS = "https://j13a503.p.ssafy.io"
API_KEY = "20gxF6G1MgMwcZ0h6eGTuivXRwwu1KsqwsJh9N9JBS0" # 실제 Hub API 키로 변경
SENIOR_ID = 17 # 테스트하려는 노인 ID

# --- 로깅 설정 ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("broadcaster")

# --- 전역 변수 ---
sio = socketio.AsyncClient(logger=True, engineio_logger=True)
pc = RTCPeerConnection() # 단일 PeerConnection 관리

# ▼▼▼▼▼ [추가] CameraStreamTrack 클래스 정의 ▼▼▼▼▼
class CameraStreamTrack(VideoStreamTrack):
    """OpenCV를 사용하여 카메라 영상을 스트리밍하는 비디오 트랙"""
    def __init__(self):
        super().__init__()
        self.cap = cv2.VideoCapture(0) # 0번 카메라 사용
        if not self.cap.isOpened():
            raise Exception("Could not open video camera")
        logger.info("📷 카메라가 성공적으로 열렸습니다.")

    async def recv(self):
        pts, time_base = await self.next_timestamp()
        ret, frame = self.cap.read()
        if not ret:
            return None

        # OpenCV의 BGR 포맷을 aiortc가 사용하는 RGB 포맷으로 변환
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # NumPy 배열을 VideoFrame 객체로 변환
        video_frame = VideoFrame.from_ndarray(frame_rgb, format="rgb24")
        video_frame.pts = pts
        video_frame.time_base = time_base
        return video_frame

    def stop(self):
        if self.cap.isOpened():
            self.cap.release()
            logger.info("📷 카메라가 닫혔습니다.")
# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

# --- Socket.IO 이벤트 핸들러 ---

@sio.event
async def connect():
    """
    서버와 안정적인 연결이 '완전히' 수립된 것이 보장되는 유일한 장소입니다.
    이제 우리가 주도권을 갖고 인증을 시작합니다.
    """
    logger.info(f"✅ 서버에 연결되었습니다. SID: {sio.sid}. 이제 인증을 시도합니다.")
    try:
        # 연결이 보장된 이곳에서 인증 정보를 보냅니다.
        await sio.emit(ConnectEvents.AUTHENTICATE, {'api_key': API_KEY})
        logger.info("🚀 인증 정보를 서버로 전송했습니다.")
    except Exception as e:
        logger.error(f"인증 정보 전송 중 오류 발생: {e}")

@sio.on(ConnectEvents.REQUEST_AUTH)
async def on_request_auth(data=None):
    """
    서버가 보내는 인증 요청은 이제 무시합니다.
    왜냐하면 connect 핸들러에서 우리가 알아서 보낼 것이기 때문입니다.
    """
    logger.info("ℹ️ 서버로부터 인증 요청을 받았지만, connect 핸들러에서 처리하므로 무시합니다.")
    pass # 아무것도 하지 않음

@sio.on(ConnectEvents.AUTH_SUCCESS)
async def on_auth_success():
    logger.info("🎉 인증에 성공했습니다. WebRTC 방송을 시작합니다.")
    await start_webrtc_broadcast()

@sio.event
async def disconnect():
    logger.info("👋 서버와의 연결이 끊어졌습니다.")
    if pc and pc.connectionState != "closed":
        await pc.close()

@sio.on(WebRTCEvents.NEW_ANSWER)
async def on_new_answer(data):
    logger.info("📬 [Answer 수신] FE로부터 Answer를 받았습니다.")
    if pc and pc.signalingState != "closed":
        try:
            answer = RTCSessionDescription(sdp=data["sdp"], type=data["type"])
            await pc.setRemoteDescription(answer)
            logger.info("✅ Remote Description 설정 완료 (Answer)")
        except Exception as e:
            logger.error(f"❌ Answer 처리 중 오류 발생: {e}")

@sio.on(WebRTCEvents.NEW_ICE_CANDIDATE)
async def on_ice_candidate(data):
    logger.info(f"📬 [ICE 수신] FE로부터 ICE Candidate를 받았습니다.")
    if pc and data and data.get("candidate"):
        try:
            candidate = RTCIceCandidate(
                sdpMid=data.get("sdpMid"),
                sdpMLineIndex=data.get("sdpMLineIndex"),
                candidate=data.get("candidate"),
            )
            await pc.addIceCandidate(candidate)
            logger.info("✅ ICE Candidate 추가 완료")
        except Exception as e:
            logger.error(f"❌ ICE Candidate 처리 중 오류 발생: {e}")

# --- WebRTC 관련 함수 ---

async def start_webrtc_broadcast():
    """WebRTC PeerConnection을 생성하고 Offer를 서버에 전송합니다."""
    global pc
    if pc.connectionState != "closed":
        await pc.close()
    pc = RTCPeerConnection()

    @pc.on("icecandidate")
    async def on_icecandidate(candidate):
        if candidate:
            logger.info(f"📬 [ICE 생성] ICE Candidate 생성 완료")
            # ▼▼▼▼▼ [수정 1] 서버 핸들러 형식에 맞게 senior_id와 데이터를 별도 인자로 전송 ▼▼▼▼▼
            ice_data = {
                "candidate": candidate.candidate,
                "sdpMid": candidate.sdpMid,
                "sdpMLineIndex": candidate.sdpMLineIndex,
            }
            await sio.emit(
                WebRTCEvents.SEND_ICE_CANDIDATE,
                (SENIOR_ID, ice_data) # 튜플로 묶어서 전송
            )
            # ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    # ▼▼▼▼▼ [수정] 더미 영상 대신 CameraStreamTrack 사용 ▼▼▼▼▼
    try:
        video_track = CameraStreamTrack()
        pc.addTrack(video_track)
    except Exception as e:
        logger.error(f"❌ 카메라 트랙 추가 중 오류 발생: {e}")
        return
    # ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    logger.info("✅ Local Description 설정 완료 (Offer)")

    logger.info(f"🚀 [Offer 전송] 서버에 Offer를 등록합니다 (senior_id: {SENIOR_ID})")
    # ▼▼▼▼▼ [수정 2] 서버 핸들러 형식에 맞게 senior_id와 데이터를 별도 인자로 전송 ▼▼▼▼▼
    offer_data = {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
    await sio.emit(
        WebRTCEvents.REGISTER_OFFER,
        (SENIOR_ID, offer_data) # 튜플로 묶어서 전송
    )
    # ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

# --- 메인 실행 로직 ---

async def main():
    try:
        await sio.connect(
            SERVER_ADDRESS,
            socketio_path='/socket.io' # Nginx 경로와 일치
        )
        await sio.wait()
    except Exception as e:
        logger.error(f"❌ 연결 또는 실행 중 오류 발생: {e}")
    finally:
        if sio.connected:
            await sio.disconnect()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n프로그램을 종료합니다.")