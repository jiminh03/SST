import asyncio
from web.schemas.socket_event import AlarmEvents
from web.services.websocket import sio

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

async def notify_sensor_event(sid, sensor_event_log):
    await sio.emit(AlarmEvents.NOTIFY_SENSOR_EVENT,sensor_event_log, to=sid)

    