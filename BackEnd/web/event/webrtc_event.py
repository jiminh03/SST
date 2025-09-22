#socket.io에서 핸들링할 이벤트 목록
from web.services.websocket import sio
from web.services.database import db,red
from common.modules.session_manager import SessionManager, SessionType, ConnectionInfo
from common.modules.webrtc_manager import WebRTCManager
from common.modules.user_manager import UserManager
from common.modules.iot_hub_manager import IotHubManager
from web.schemas.socket_event import WebRTCEvents


rtc_man = WebRTCManager(red)
sess_man = SessionManager(red)

# WebRTC 시그널링 이벤트 핸들러 ---

@sio.on(WebRTCEvents.REGISTER_OFFER)
async def on_register_offer(sid, senior_id, data):
    """(로봇 -> 서버) 로봇이 Offer를 등록하는 이벤트"""
    await rtc_man.register_offer(senior_id, data)
    # async for session in db.get_session():
    #     staff_info = await UserManager(session).get_senior_staff(senior_id)
    #     if staff_info:
    #         staff_id = staff_info.staff_id
    #         fe_sess=await SessionManager(red).get_session_by_staff_id(staff_id)
    #         if fe_sess:
    #             recv_sid = fe_sess.sid
    #             await sio.emit(WebRTCEvents.NEW_OFFER, data, to=recv_sid)
        

@sio.on(WebRTCEvents.CHECK_OFFER)
async def on_check_offer(sid, senior_id):
    """(서버 -> FE) 이미 등록된 offer 확인하는 이벤트"""
    offer = await rtc_man.get_offer(senior_id)
    if offer:
        await sio.emit(WebRTCEvents.NEW_OFFER, offer, to=sid)

@sio.on(WebRTCEvents.SEND_ANSWER)
async def on_send_answer(sid, senior_id, data):
    """(FE -> 서버) FE가 Answer를 제출하는 이벤트"""
    async for session in db.get_session():
        hub_info = await IotHubManager(session).get_hub_by_senior_id(senior_id)
        recv_sid = (await SessionManager(red).get_session_by_hub_id(hub_info.hub_id)).sid
        
    await rtc_man.register_answer(senior_id, data)
    await sio.emit(WebRTCEvents.NEW_ANSWER, data, to=recv_sid)

@sio.on(WebRTCEvents.CHECK_ANSWER)
async def on_check_answer(sid, senior_id):
    """(서버 -> FE) 이미 등록된 offer 확인하는 이벤트"""
    answer = await rtc_man.get_answer(senior_id)
    if answer:
        await sio.emit(WebRTCEvents.NEW_ANSWER, answer, to=sid)

@sio.on(WebRTCEvents.SEND_ICE_CANDIDATE)
async def on_send_ice_candidate(sid, senior_id, data):
    """(로봇/FE -> 서버) ICE Candidate를 중계하는 이벤트"""
    sess_info = await sess_man.get_session_by_sid(sid)
    async for session in db.get_session():
        if sess_info.session_type == SessionType.HUB:
            staff_id = (await UserManager(session).get_senior_staff(senior_id)).staff_id
            recv_sid = (await SessionManager(red).get_session_by_staff_id(staff_id)).sid        
        elif sess_info.session_type == SessionType.FE:
            hub_info = await IotHubManager(session).get_hub_by_senior_id(senior_id)
            recv_sid = await SessionManager(red).get_session_by_hub_id(hub_info.hub_id).sid
        else:
            return
   
    if recv_sid:
        # 상대방에게 'server:new_ice_candidate' 이벤트를 보냅니다.
        print(f"[ICE 전송] {sid} -> {recv_sid} ICE Candidate 수신")
        await sio.emit(WebRTCEvents.SEND_ICE_CANDIDATE, data, to=recv_sid)