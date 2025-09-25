from common.modules.session_manager import SessionManager
from common.modules.user_manager import UserManager
from web.schemas.monitoring_schema import SeniorStatus
from web.schemas.socket_event import NotifyEvents
from web.services.database import db,red
from web.services.websocket import sio



async def notify_senior_status_change(senior_id: int, status: SeniorStatus):
    """
    어르신 상태 변경을 클라이언트에게 알립니다.
    """
    
    async for session in db.get_session():
        staff_id = (await UserManager(session).get_senior_staff(senior_id)).staff_id
        recv_sid = (await SessionManager(red).get_session_by_staff_id(staff_id)).sid   
    
    # Pydantic 모델을 dict로 변환하여 전송
    status_dict = status.model_dump(mode='json')
    
    await sio.emit(NotifyEvents.SERVER_NOTIFY_SENIOR_STATUS_CHANGE, status_dict, to=recv_sid)
    print(f"이벤트: {NotifyEvents.SERVER_NOTIFY_SENIOR_STATUS_CHANGE}, 데이터: {status_dict}, to: {recv_sid}")
