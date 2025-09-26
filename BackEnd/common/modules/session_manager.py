import json
from typing import Optional, Union

from common.schemas.session import ConnectionInfo
from common.modules.db_manager import RedisSessionManager

class SessionManager:
    def __init__(self, r: RedisSessionManager):
        self.red_sess = r

    def _get_key(self, key_type: str, value: Union[str, int]) -> str:
        return f"session:{key_type}:{value}"

    async def create_session(self, session_info: ConnectionInfo) -> None:
        redis_client = await self.red_sess.get_client()
        
        async with redis_client.pipeline() as pipe:
            sid_key = self._get_key("sid", session_info.sid)
            session_data_json = session_info.to_json()
            
            await pipe.set(sid_key, session_data_json)
            print(f"[SET] {sid_key}")

            if session_info.hub_id is not None:
                hub_id_key = self._get_key("hub_id", session_info.hub_id)
                await pipe.set(hub_id_key, session_info.sid)
                print(f"[SET-INDEX] {hub_id_key} -> {session_info.sid}")

            if session_info.staff_id is not None:
                staff_id_key = self._get_key("staff_id", session_info.staff_id)
                await pipe.set(staff_id_key, session_info.sid)
                print(f"[SET-INDEX] {staff_id_key} -> {session_info.sid}")

            await pipe.execute()
        print("--- 세션 생성이 완료되었습니다. ---")

    async def get_session_by_sid(self, sid: str) -> Optional[ConnectionInfo]:
        redis_client = await self.red_sess.get_client()
        sid_key = self._get_key("sid", sid)
        session_data_json = await redis_client.get(sid_key)

        if session_data_json:
            print(f"(sid: {sid}) -> 세션을 찾았습니다.")
            return ConnectionInfo.from_dict(json.loads(session_data_json))
        
        print(f"(sid: {sid}) -> 세션을 찾을 수 없습니다.")
        return None

    async def get_session_by_hub_id(self, hub_id: int) -> Optional[ConnectionInfo]:
        redis_client = await self.red_sess.get_client()
        hub_id_key = self._get_key("hub_id", hub_id)
        sid = await redis_client.get(hub_id_key)

        if sid:
            print(f"(hub_id: {hub_id}) -> sid({sid})를 찾았습니다. 세부 정보를 조회합니다.")
            return await self.get_session_by_sid(sid)
        
        print(f"(hub_id: {hub_id}) -> 해당 인덱스를 찾을 수 없습니다.")
        return None

    async def get_session_by_staff_id(self, staff_id: int) -> Optional[ConnectionInfo]:
        redis_client = await self.red_sess.get_client()
        staff_id_key = self._get_key("staff_id", staff_id)
        sid = await redis_client.get(staff_id_key)

        if sid:
            print(f"(staff_id: {staff_id}) -> sid({sid})를 찾았습니다. 세부 정보를 조회합니다.")
            return await self.get_session_by_sid(sid)

        print(f"(staff_id: {staff_id}) -> 해당 인덱스를 찾을 수 없습니다.")
        return None

    async def delete_session(self, sid: str) -> bool:
        session_info = await self.get_session_by_sid(sid)
        if not session_info:
            print(f"삭제할 세션(sid: {sid})이 존재하지 않습니다.")
            return False

        redis_client = await self.red_sess.get_client()
        async with redis_client.pipeline() as pipe:
            sid_key = self._get_key("sid", session_info.sid)
            await pipe.delete(sid_key)
            print(f"[DELETE] {sid_key}")

            if session_info.hub_id is not None:
                hub_id_key = self._get_key("hub_id", session_info.hub_id)
                await pipe.delete(hub_id_key)
                print(f"[DELETE-INDEX] {hub_id_key}")

            if session_info.staff_id is not None:
                staff_id_key = self._get_key("staff_id", session_info.staff_id)
                await pipe.delete(staff_id_key)
                print(f"[DELETE-INDEX] {staff_id_key}")
            
            results = await pipe.execute()

        print("--- 세션 삭제가 완료되었습니다. ---")
        return sum(results) > 0