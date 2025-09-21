#socket.io에서 핸들링할 이벤트 목록
from web.main import sio
from web.services.database import db,red
from common.modules.session_manager import SessionManager, SessionType, ConnectionInfo
from common.modules.webrtc_manager import WebRTCManager, WebRTCRobotOffer, WebRTCFEAnswer
from common.modules.user_manager import UserManager
from common.modules.iot_hub_manager import IotHubManager
from web.schemas.socket_event import WebRTCEvents


rtc_man = WebRTCManager(red)
sess_man = SessionManager(red)

# WebRTC 시그널링 이벤트 핸들러 ---

@sio.on(WebRTCEvents.REGISTER_OFFER)
async def on_register_offer(sid, data):
    """(로봇 -> 서버) 로봇이 Offer를 등록하는 이벤트"""
    hub_man = IotHubManager(db.get_session())

    sess_info = await sess_man.get_session_by_sid(sid)
    hub_info =  await hub_man.get_hub_info(sess_info.hub_id)

    await rtc_man.register_offer(hub_info.senior_id, WebRTCRobotOffer.from_dict(data))

@sio.on(WebRTCEvents.NEW_OFFER)
async def on_register_offer(sid, data):
    """(서버 -> FE) 서버가 Offer를 FE에 전달하는 이벤트"""
    offer = await rtc_man.get_offer(data.get('senior_id'))
    if offer:
        await sio.emit(WebRTCEvents.NEW_OFFER, offer)

@sio.on(WebRTCEvents.SEND_ANSWER)
async def on_send_answer(sid, data):
    """(FE -> 서버) FE가 Answer를 제출하는 이벤트"""
    await rtc_man.register_answer(data.get('senior_id'), WebRTCFEAnswer.from_dict(data))
    

@sio.on(WebRTCEvents.SEND_ICE_CANDIDATE)
async def on_send_ice_candidate(sid, data):
    """(로봇/FE -> 서버) ICE Candidate를 중계하는 이벤트"""
    #TODO: FE와 로봇이 서로의 sid를 알 수 있어야함
    sender_id = await rtc_man.
    if not sender_id: return

    target_id = data.get('target_id') # 메시지에 상대방 ID를 포함해야 함
    print(f"🌐 [ICE 수신] {sender_id} -> {target_id} ICE Candidate 수신")
    
    # Candidate를 전달할 상대방의 sid를 찾습니다.
    target_sid = await rtc_man.get(f"user:{target_id}:sid")
    if target_sid:
        # 상대방에게 'server:new_ice_candidate' 이벤트를 보냅니다.
        await sio.emit('server:new_ice_candidate', data, to=target_sid)