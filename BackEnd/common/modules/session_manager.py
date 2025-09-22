import json
from typing import Optional, Union

# common/schemas/session.py 에 있다고 가정합니다.
from common.schemas.session import SessionType, ConnectionInfo
from common.modules.db_manager import RedisSessionManager

class SessionManager:
    """
    Redis를 사용하여 다양한 키로 세션을 관리하는 비동기 클래스.
    - sid, hub_id, staff_id로 세션 조회 가능
    """

    def __init__(self, r: RedisSessionManager):
        """
        SessionManager를 초기화합니다.
        :param r: 비동기 RedisSessionManager 인스턴스
        """
        self.red_sess = r

    def _get_key(self, key_type: str, value: Union[str, int]) -> str:
        """세션 관련 Redis 키를 생성합니다. (이 함수는 I/O가 없으므로 async가 아님)"""
        return f"session:{key_type}:{value}"

    async def create_session(self, session_info: ConnectionInfo) -> None:
        """
        세션 정보를 Redis에 여러 인덱스와 함께 비동기적으로 등록합니다.
        모든 작업은 파이프라인으로 처리되어 원자성을 보장합니다.
        """
        # 비동기 Redis 클라이언트를 가져옵니다.
        redis_client = await self.red_sess.get_client()
        
        # 비동기 파이프라인은 'async with'를 사용합니다.
        async with redis_client.pipeline() as pipe:
            sid_key = self._get_key("sid", session_info.sid)
            session_data_json = session_info.to_json()
            
            # 1. 기본 세션 데이터 저장 (모든 호출에 await 필요)
            await pipe.set(sid_key, session_data_json)
            print(f"[SET] {sid_key}")

            # 2. hub_id 인덱스 저장
            if session_info.hub_id is not None:
                hub_id_key = self._get_key("hub_id", session_info.hub_id)
                await pipe.set(hub_id_key, session_info.sid)
                print(f"[SET-INDEX] {hub_id_key} -> {session_info.sid}")

            # 3. staff_id 인덱스 저장
            if session_info.staff_id is not None:
                staff_id_key = self._get_key("staff_id", session_info.staff_id)
                await pipe.set(staff_id_key, session_info.sid)
                print(f"[SET-INDEX] {staff_id_key} -> {session_info.sid}")

            # 파이프라인 실행
            await pipe.execute()
        print("--- 세션 생성이 완료되었습니다. ---")

    async def get_session_by_sid(self, sid: str) -> Optional[ConnectionInfo]:
        """sid를 이용해 직접 세션 정보를 비동기적으로 조회합니다."""
        redis_client = await self.red_sess.get_client()
        sid_key = self._get_key("sid", sid)
        session_data_json = await redis_client.get(sid_key)

        if session_data_json:
            print(f"(sid: {sid}) -> 세션을 찾았습니다.")
            return ConnectionInfo.from_dict(json.loads(session_data_json))
        
        print(f"(sid: {sid}) -> 세션을 찾을 수 없습니다.")
        return None

    async def get_session_by_hub_id(self, hub_id: int) -> Optional[ConnectionInfo]:
        """hub_id를 이용해 세션 정보를 비동기적으로 조회합니다."""
        redis_client = await self.red_sess.get_client()
        hub_id_key = self._get_key("hub_id", hub_id)
        sid = await redis_client.get(hub_id_key)

        if sid:
            print(f"(hub_id: {hub_id}) -> sid({sid})를 찾았습니다. 세부 정보를 조회합니다.")
            return await self.get_session_by_sid(sid)
        
        print(f"(hub_id: {hub_id}) -> 해당 인덱스를 찾을 수 없습니다.")
        return None

    async def get_session_by_staff_id(self, staff_id: int) -> Optional[ConnectionInfo]:
        """staff_id를 이용해 세션 정보를 비동기적으로 조회합니다."""
        redis_client = await self.red_sess.get_client()
        staff_id_key = self._get_key("staff_id", staff_id)
        sid = await redis_client.get(staff_id_key)

        if sid:
            print(f"(staff_id: {staff_id}) -> sid({sid})를 찾았습니다. 세부 정보를 조회합니다.")
            return await self.get_session_by_sid(sid)

        print(f"(staff_id: {staff_id}) -> 해당 인덱스를 찾을 수 없습니다.")
        return None

    async def delete_session(self, sid: str) -> bool:
        """
        sid를 기반으로 세션 정보와 모든 관련 인덱스를 비동기적으로 삭제합니다.
        """
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