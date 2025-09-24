import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from common.modules.iot_hub_manager import IotHubManager
from common.modules.user_manager import UserManager
from services.websocket import sio
from web.schemas.socket_event import AlarmEvents
from common.modules.session_manager import SessionManager
from web.services.database import db,red
from web.services.safety_alarm import notify_emergency_situation, notify_safety_check_failed


sess_man = SessionManager(red)

#TODO:hub iot 오작동, 로봇 고장 같은 확인 실패도 핸들링해야함

@sio.on(AlarmEvents.REPORT_SENIOR_IS_SAFE)
async def handle_report_senior_is_safe(sid, data):
    """Hub가 '어르신 안전'을 보고했을 때 처리"""
    print(f"Hub로부터 안전 보고 수신 (sid: {sid}): {data}")

@sio.on(AlarmEvents.REPORT_EMERGENCY)
async def handle_report_emergency(sid, data):
    """Hub가 '응급 상황'을 보고했을 때 처리"""
    print(f"Hub로부터 응급 상황 보고 수신 (sid: {sid}): {data}")
    sess_info = await sess_man.get_session_by_sid(sid)
    
    async for session in db.get_session():
        staff_id = (await UserManager(session).get_senior_staff(sess_info.senior_id)).staff_id
        recv_sid = (await SessionManager(red).get_session_by_staff_id(staff_id)).sid

    if recv_sid:
        await notify_emergency_situation(recv_sid)
    else:
        print(f"경고: sid {recv_sid}에 연결된 FE 클라이언트를 찾을 수 없습니다.")

@sio.on(AlarmEvents.REPORT_CHECK_FAILED)
async def handle_report_check_failed(sid, data):
    """Hub가 '안전 점검 자체의 실패'를 보고했을 때 처리"""
    print(f"Hub로부터 안전 점검 실패 보고 수신 (sid: {sid}): {data}")
    sess_info = await sess_man.get_session_by_sid(sid)
    async for session in db.get_session():
        staff_id = (await UserManager(session).get_senior_staff(sess_info.senior_id)).staff_id
        recv_sid = (await SessionManager(red).get_session_by_staff_id(staff_id)).sid
    if recv_sid:
        await notify_safety_check_failed(recv_sid)
    else:
        print(f"경고: sid {recv_sid}에 연결된 FE 클라이언트를 찾을 수 없습니다.")
