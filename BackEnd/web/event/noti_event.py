from web.services.websocket import sio
from web.services.senior_status_manager import SeniorStatusManager
from common.modules.session_manager import SessionManager, SessionType, ConnectionInfo
from common.modules.user_manager import UserManager
from web.services.database import db,red
from web.schemas.socket_event import NotifyEvents
from web.schemas.monitoring_schema import SeniorStatus


@sio.on(NotifyEvents.CLIENT_REQUEST_INITIAL_STATUS)
async def notify_initial_status(sid: str):
    """
    클라이언트로부터 받은 어르신 상태 목록을 검증하고 다시 전송합니다.
    Pydantic이 데이터 유효성 검사를 자동으로 수행합니다.
    """

    sso = SeniorStatusManager(red)
    sses_man = SessionManager(red)
    staff_id = (await sses_man.get_session_by_sid(sid)).staff_id
    
    async for session in db.get_session():
        senior_list = await UserManager(session).get_care_seniors(staff_id)
    status_list = [await sso.get_status(s.senior_id) for s in senior_list]
    
    # 1. Pydantic 모델 리스트를 JSON 직렬화가 가능한 dict 리스트로 변환
    #    - 리스트의 각 status 객체에 대해 model_dump()를 호출합니다.
    statuses_to_send = [s.model_dump(mode='json') for s in status_list]
    
    # 2. 변환된 데이터를 클라이언트로 전송
    await sio.emit(
        NotifyEvents.SERVER_SEND_INITIAL_STATUS, 
        statuses_to_send, 
        to=sid
    )
    
    print(f"✅ 이벤트 전송: {NotifyEvents.SERVER_SEND_INITIAL_STATUS}, 받는 이: {sid}")


