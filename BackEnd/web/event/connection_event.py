from typing import Union
from web.services.websocket import sio
from web.services.auth_service import auth_module
from common.modules.api_key_manager import ApiKeyRepository
from web.services.database import db,red

from web.schemas.socket_event import ConnectEvents
from common.modules.session_manager import SessionManager, SessionType, ConnectionInfo

session_man = SessionManager(red)

class StaffAuthPacket:
    """스태프 인증을 위한 패킷 스키마"""
    jwt: str

class HubAuthPacket:
    """허브 인증을 위한 패킷 스키마"""
    api_key: str

AuthPacket = Union[HubAuthPacket, StaffAuthPacket]
    

@sio.on(ConnectEvents.CONNECT)
async def connect(sid, environ):
    print(f"✅ [연결 시도] 클라이언트 접속. sid: {sid}")
    # 연결 직후 인증을 요청하는 메시지를 보낼 수 있습니다.
    await sio.emit(ConnectEvents.REQUEST_AUTH, to=sid)

@sio.on(ConnectEvents.AUTHENTICATE)
async def authenticate(sid, data: AuthPacket):
    """클라이언트가 보낸 토큰으로 인증하고 Redis에 세션 정보를 저장합니다."""
    
    if 'api_key' in data:
        async for session in db.get_session():
            api_key = data.get('api_key')
            apikey_repo = ApiKeyRepository(session)
            hub_info = await apikey_repo.get_hub_by_api_key(api_key)
            con_info = ConnectionInfo(
                sid=sid,
                session_type=SessionType.HUB,
                hub_id=hub_info.hub_id,
            )
            await session_man.create_session(con_info)
            await sio.emit(ConnectEvents.AUTH_SUCCESS, to=sid)
    elif 'jwt' in data:
        jwt = data.get('jwt')
        async for session in db.get_session():
            user_info = await auth_module.get_current_user(jwt, session)
        con_info = ConnectionInfo(
            sid=sid,
            session_type=SessionType.FE,
            staff_id=user_info.staff_id
        )
        await session_man.create_session(con_info)
        await sio.emit(ConnectEvents.AUTH_SUCCESS, to=sid)
    else:
        print(f"[인증 실패] 유효하지 않은 인증 패킷입니다. sid: {sid}, data: {data}")
        await sio.disconnect(sid)

@sio.on(ConnectEvents.DISCONNECT)
async def disconnect(sid):
    """연결 종료 시 Redis에서 매핑 정보를 삭제합니다."""
    await session_man.delete_session(sid)
    print(f"👋 [연결 종료] 클라이언트 연결 끊김. sid: {sid}")

