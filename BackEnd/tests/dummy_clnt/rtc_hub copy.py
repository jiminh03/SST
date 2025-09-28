'''
WebRTC 방송 송출 클라이언트 (Robot/Hub)

이 스크립트는 python-socketio와 aiortc 라이브러리를 사용하여
Socket.IO 서버에 연결하고, 로컬 카메라의 비디오 스트림을
WebRTC를 통해 방송(Broadcast)합니다.
'''
import asyncio
import logging

import socketio
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, VideoStreamTrack
from aiortc.contrib.media import MediaPlayer

from web.schemas.socket_event import ConnectEvents
from web.schemas.socket_event import WebRTCEvents
from web.schemas.socket_event import AlarmEvents
import cv2
from av import VideoFrame

# --- 설정 ---
# 연결할 시그널링 서버의 주소입니다.
SERVER_ADDRESS = "https://j13a503.p.ssafy.io"

# 추후 api를 통해 가져와야함
# 서버 인증을 위한 API 키입니다.
API_KEY = "20gxF6G1MgMwcZ0h6eGTuivXRwwu1KsqwsJh9N9JBS0"
# 이 방송 스트림을 고유하게 식별하기 위한 ID입니다.
# 프론트엔드(Viewer)에서는 이 ID를 사용하여 특정 스트림을 요청하게 됩니다.
SENIOR_ID = 17

# --- 로깅 설정 ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("broadcaster")

# --- 전역 변수 ---
# 비동기 Socket.IO 클라이언트 인스턴스를 생성합니다.
sio = socketio.AsyncClient(logger=True, engineio_logger=True)

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





# 허브-백엔드 웹소켓 세션 관련 이벤트 핸들러
@sio.event
async def connect():
    """
    Socket.IO 서버와 연결이 성공적으로 수립되면 호출됩니다.
    연결 후 즉시 인증 절차를 시작합니다.
    """
    logger.info(f"서버에 연결되었습니다. SID: {sio.sid}. 이제 인증을 시도합니다.")
    try:
        # 1. 서버에 API 키를 전송하여 이 클라이언트를 인증합니다.
        await sio.emit(ConnectEvents.AUTHENTICATE, {'api_key': API_KEY})
        logger.info("인증 정보를 서버로 전송했습니다.")
    except Exception as e:
        logger.error(f"인증 정보 전송 중 오류 발생: {e}")

@sio.on(ConnectEvents.AUTH_SUCCESS)
async def on_auth_success():
    """서버로부터 인증 성공 이벤트를 수신하면 호출됩니다."""
    # 2. 인증이 성공했으므로, WebRTC 방송 절차를 시작합니다.
    logger.info("인증에 성공했습니다. WebRTC 방송을 시작합니다.")

@sio.event
async def disconnect():
    """서버와의 연결이 끊어졌을 때 호출됩니다."""
    logger.info("서버와의 연결이 끊어졌습니다.")

# 이상치 알림 관린
@sio.on(AlarmEvents.REQUEST_SAFETY_CHECK)
async def on_request_safety_check():
    mqtt_send_safety_check(to=robot)

#mqtt 이벤트 핸들러: 안전이 확인된 경우
async def SENIOR_IS_SAFE():
    #노인 안전을 서버에 알림
    await sio.emit(AlarmEvents.SENIOR_IS_SAFE)

#mqtt 이벤트 핸들러: 응급상황인 경우
#로봇은 mqtt로 응급상황을 알림 토픽 및  webrtc offer 토픽 둘 다 실행해야함 
async def EMERGENCY_SITUATION():
    #응급 상황 발생을 서버에 알림
    await sio.emit(AlarmEvents.EMERGENCY_SITUATION)


# 허브-백엔드 웹소켓 세션 관련 이벤트 핸들러
@sio.on(WebRTCEvents.NEW_ANSWER)
async def on_new_answer(data):
    """
    7. Viewer(프론트엔드)가 생성한 Answer를 서버를 통해 수신했을 때 호출됩니다.
    이 Answer SDP를 remote description으로 설정하여 연결을 계속 진행합니다.
    """
    logger.info("[Answer 수신] FE로부터 Answer를 받았습니다.")
    mqtt_send_answer(to=robot,answer=data)

@sio.on(WebRTCEvents.NEW_ICE_CANDIDATE)
async def on_ice_candidate(data):
    """
    8. Viewer로부터 새로운 ICE Candidate를 수신했을 때 호출됩니다.
    수신된 Candidate는 P2P 연결 경로를 설정하는 데 사용됩니다.
    """
    logger.info(f"[ICE 수신] FE로부터 ICE Candidate를 받았습니다.")
    # 로벳에서 FE에 ice 전달
    mqtt_send_ice(to=robot, ice=ice)


### mqtt 이벤트
#mqtt 이벤트 핸들러: 로봇으로부터 offer받기
async def REGISTER_OFFER(offer_data):
    await sio.emit(
        WebRTCEvents.REGISTER_OFFER,
        (SENIOR_ID, offer_data)
    )

#mqtt 이벤트 핸들러: 로봇으로부터 ICE받기
async def NEW_ICE_CANDIDATE(ice_data):
    #프론트가 ice를 받을 수 있도록 ice를 백엔드에 전송
    await sio.emit(
        WebRTCEvents.SEND_ICE_CANDIDATE,
        (SENIOR_ID, ice_data)
    )

# --- 메인 실행 로직 ---

async def main():
    """
    메인 비동기 함수. Socket.IO 서버에 연결하고 연결이 종료될 때까지 대기합니다.
    """
    try:
        await sio.connect(
            SERVER_ADDRESS,
            socketio_path='/socket.io' # 서버의 socket.io 경로에 맞게 설정
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