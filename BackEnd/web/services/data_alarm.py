from common.modules.session_manager import SessionManager
from common.modules.user_manager import UserManager
from web.schemas.monitoring_schema import FrontendSensorItem, FrontendSensorStatusPayload, SeniorStatus
from web.schemas.socket_event import NotifyEvents
from web.services.database import db,red
from web.services.hub_service import SensorDataService
from web.services.websocket import sio
from web.schemas.iot_schema import SensorLogPayload, SensorDataItem
from common.modules.api_key_manager import ApiKeyRepository

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


async def notify_sensor_status_item_change(senior_id: int, status: FrontendSensorItem):
    """
    어르신 상태 변경을 클라이언트에게 알립니다.
    """
    
    async for session in db.get_session():
        staff_id = (await UserManager(session).get_senior_staff(senior_id)).staff_id
        recv_sid = (await SessionManager(red).get_session_by_staff_id(staff_id)).sid   
    
    # Pydantic 모델을 dict로 변환하여 전송
    status.senior_id = senior_id
    status_dict = status.model_dump(mode='json')
    
    await sio.emit(NotifyEvents.SERVER_NOTIFY_SENSOR_STATUS_CHANGE, status_dict, to=recv_sid)
    print(f"이벤트: {NotifyEvents.SERVER_NOTIFY_SENSOR_STATUS_CHANGE}, 데이터: {status_dict}, to: {recv_sid}")

async def notify_sensor_status_log_change(log :FrontendSensorStatusPayload):
    """
    어르신 상태 변경 내역들을 클라이언트에게 알립니다.
    """

    for item in log.sensors:
        await notify_sensor_status_item_change(log.senior_id, item)