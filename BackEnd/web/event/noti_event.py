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

sess_man = SessionManager(red)

#TODO:hub iot 오작동, 로봇 고장 같은 확인 실패도 핸들링해야함

async def request_safety_check(sid):
    try:
        print("안전 점검을 요청합니다... 60초 안에 응답을 기다립니다.")
        
        # 'request_safety_check' 이벤트를 보내고 응답을 기다립니다.
        response = await sio.call(
            AlarmEvents.REQUEST_SAFETY_CHECK,
            to=sid,
            timeout=60  # 60초 타임아웃
        )
        
        print(f"클라이언트로부터 응답을 받았습니다: {response}")
        # response 값에 따라 성공/실패 로직 처리
        if response.get('status') == 'ok':
            print("안전 점검 성공!")
        else:
            print("안전 점검 실패: 클라이언트가 문제를 보고했습니다.")

    except asyncio.TimeoutError:
        print("시간 초과: 클라이언트로부터 응답이 없습니다. 오작동으로 간주합니다.")
        # 타임아웃 시의 비상 로직 (예: 관리자에게 알림)

    except Exception as e:
        print(f"에러 발생: {e}")

async def notify_emergency_situation(sid):
    await sio.emit(AlarmEvents.EMERGENCY_SITUATION, to=sid)

async def notify_safety_check_failed(sid):
    await sio.emit(AlarmEvents.SAFETY_CHECK_FAILED, to=sid)

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
