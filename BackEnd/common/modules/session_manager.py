import json
from typing import Optional, Union
from redis import Redis

# common/schemas/session.py 에 있다고 가정합니다.
from common.schemas.session import SessionType, ConnectionInfo

class SessionManager:
    """
    Redis를 사용하여 다양한 키로 세션을 관리하는 클래스.
    - sid, hub_id, staff_id로 세션 조회 가능
    """

    def __init__(self, r: Redis):
        """
        SessionManager를 초기화합니다.
        :param r: Redis 클라이언트 인스턴스
        """
        self.redis = r

    def _get_key(self, key_type: str, value: Union[str, int]) -> str:
        """세션 관련 Redis 키를 생성합니다."""
        return f"session:{key_type}:{value}"

    def create_session(self, session_info: ConnectionInfo) -> None:
        """
        세션 정보를 Redis에 여러 인덱스와 함께 등록합니다.
        모든 작업은 파이프라인으로 처리되어 원자성을 보장합니다.
        """
        # Redis 파이프라인 시작
        with self.redis.pipeline() as pipe:
            sid_key = self._get_key("sid", session_info.sid)
            session_data_json = session_info.to_json()
            
            # 1. 기본 세션 데이터 저장 (sid -> session_info)
            pipe.set(sid_key, session_data_json)
            print(f"[SET] {sid_key}")

            # 2. hub_id 인덱스 저장 (hub_id -> sid)
            if session_info.hub_id is not None:
                hub_id_key = self._get_key("hub_id", session_info.hub_id)
                pipe.set(hub_id_key, session_info.sid)
                print(f"[SET-INDEX] {hub_id_key} -> {session_info.sid}")

            # 3. staff_id 인덱스 저장 (staff_id -> sid)
            if session_info.staff_id is not None:
                staff_id_key = self._get_key("staff_id", session_info.staff_id)
                pipe.set(staff_id_key, session_info.sid)
                print(f"[SET-INDEX] {staff_id_key} -> {session_info.sid}")

            # 파이프라인 실행
            pipe.execute()
        print("--- 세션 생성이 완료되었습니다. ---")


    def get_session_by_sid(self, sid: str) -> Optional[ConnectionInfo]:
        """sid를 이용해 직접 세션 정보를 조회합니다."""
        sid_key = self._get_key("sid", sid)
        session_data_json = self.redis.get(sid_key)

        if session_data_json:
            print(f"(sid: {sid}) -> 세션을 찾았습니다.")
            return ConnectionInfo.from_dict(json.loads(session_data_json))
        
        print(f"(sid: {sid}) -> 세션을 찾을 수 없습니다.")
        return None

    def get_session_by_hub_id(self, hub_id: int) -> Optional[ConnectionInfo]:
        """hub_id를 이용해 세션 정보를 조회합니다."""
        hub_id_key = self._get_key("hub_id", hub_id)
        sid = self.redis.get(hub_id_key)

        if sid:
            print(f"(hub_id: {hub_id}) -> sid({sid})를 찾았습니다. 세부 정보를 조회합니다.")
            return self.get_session_by_sid(sid)
        
        print(f"(hub_id: {hub_id}) -> 해당 인덱스를 찾을 수 없습니다.")
        return None

    def get_session_by_staff_id(self, staff_id: int) -> Optional[ConnectionInfo]:
        """staff_id를 이용해 세션 정보를 조회합니다."""
        staff_id_key = self._get_key("staff_id", staff_id)
        sid = self.redis.get(staff_id_key)

        if sid:
            print(f"(staff_id: {staff_id}) -> sid({sid})를 찾았습니다. 세부 정보를 조회합니다.")
            return self.get_session_by_sid(sid)

        print(f"(staff_id: {staff_id}) -> 해당 인덱스를 찾을 수 없습니다.")
        return None

    def delete_session(self, sid: str) -> bool:
        """
        sid를 기반으로 세션 정보와 모든 관련 인덱스를 삭제합니다.
        """
        # 먼저 삭제할 세션 정보를 가져와서 인덱스 키를 알아냅니다.
        session_info = self.get_session_by_sid(sid)
        if not session_info:
            print(f"삭제할 세션(sid: {sid})이 존재하지 않습니다.")
            return False

        # 파이프라인으로 관련 키들을 모두 삭제합니다.
        with self.redis.pipeline() as pipe:
            sid_key = self._get_key("sid", session_info.sid)
            pipe.delete(sid_key)
            print(f"[DELETE] {sid_key}")

            if session_info.hub_id is not None:
                hub_id_key = self._get_key("hub_id", session_info.hub_id)
                pipe.delete(hub_id_key)
                print(f"[DELETE-INDEX] {hub_id_key}")

            if session_info.staff_id is not None:
                staff_id_key = self._get_key("staff_id", session_info.staff_id)
                pipe.delete(staff_id_key)
                print(f"[DELETE-INDEX] {staff_id_key}")
            
            results = pipe.execute()

        print("--- 세션 삭제가 완료되었습니다. ---")
        return sum(results) > 0

# --- 사용 예시 ---

if __name__ == '__main__':
    redis_client = Redis(host='localhost', port=6379, db=0, decode_responses=True)
    session_manager = SessionManager(redis_client)

    # 1. 새로운 세션 정보 생성 (hub_id와 staff_id 포함)
    hub_session = ConnectionInfo(
        sid="hub-user-456",
        session_type=SessionType.HUB,
        hub_id=101,
        staff_id=7788
    )

    # 2. 세션 등록 (기본 데이터 1개 + 인덱스 2개 = 총 3개 키 생성)
    session_manager.create_session(hub_session)
    print("\n" + "="*40 + "\n")

    # 3. 다양한 방법으로 세션 조회
    print("SID로 조회:")
    s1 = session_manager.get_session_by_sid("hub-user-456")
    if s1: print(f"  -> 찾은 세션의 staff_id: {s1.staff_id}\n")

    print("Hub ID로 조회:")
    s2 = session_manager.get_session_by_hub_id(101)
    if s2: print(f"  -> 찾은 세션의 sid: {s2.sid}\n")

    print("Staff ID로 조회:")
    s3 = session_manager.get_session_by_staff_id(7788)
    if s3: print(f"  -> 찾은 세션의 sid: {s3.sid}\n")
    print("\n" + "="*40 + "\n")
    
    # 4. 세션 삭제 (관련된 키 3개 모두 삭제)
    session_manager.delete_session("hub-user-456")
    print("\n" + "="*40 + "\n")
    
    # 5. 삭제 확인
    print("삭제 후 SID로 다시 조회:")
    s4 = session_manager.get_session_by_sid("hub-user-456")
    if not s4: print("  -> 세션이 성공적으로 삭제되었습니다.")