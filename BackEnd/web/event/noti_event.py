from web.services.websocket import sio
from web.services.senior_status_manager import SeniorStatusManager, SensorStatusManager
from common.modules.session_manager import SessionManager, SessionType, ConnectionInfo
from common.modules.user_manager import UserManager
from web.services.database import db,red
from web.schemas.socket_event import NotifyEvents
from web.services.data_alarm import notify_senior_status_change, notify_sensor_status_log_change


@sio.on(NotifyEvents.CLIENT_REQUEST_ALL_SENIOR_STATUS)
async def notify_all_senior_status(sid: str):
    async for session in db.get_session():
        sess_info = await SessionManager(red).get_session_by_sid(sid)
        senior_list = await UserManager(session).get_care_seniors(sess_info.staff_id)
        managed_senior_ids = [senior.senior_id for senior in senior_list]
    
        for senior_id in managed_senior_ids:
            senior_status= await SeniorStatusManager(red).get_status(senior_id)
            if senior_status:
                await notify_senior_status_change(senior_id, senior_status)

@sio.on(NotifyEvents.CLIENT_REQUEST_ALL_SENSOR_STATUS)
async def notify_all_sensor_status(sid: str, senior_id: int):
    packet= await SensorStatusManager(red).get_all_sensor_statuses(senior_id)
    await notify_sensor_status_log_change(packet)


