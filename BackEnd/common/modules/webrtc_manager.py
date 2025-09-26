import redis.asyncio as redis
import json
from typing import Any, Dict, Optional, Type, Union
from common.modules.db_manager import RedisSessionManager

SDP_EXPIRATION_SECONDS = 300

class WebRTCManager:
    """Redis에 WebRTC 패킷을 등록하고 조회하는 작업을 관리합니다."""

    def __init__(self, redis_session_manager: RedisSessionManager):
        """
        WebRTCManager를 초기화합니다.
        :param redis_session_manager: 비동기 RedisSessionManager 인스턴스
        """
        # SessionManager와 동일하게 RedisSessionManager 인스턴스를 받습니다.
        self.red_sess = redis_session_manager

    def _get_offer_key(self, senior_id: int) -> str:
        """Offer에 대한 Redis 키를 생성합니다."""
        return f"webrtc:offer:senior:{senior_id}"

    def _get_answer_key(self, senior_id: int) -> str:
        """Answer에 대한 Redis 키를 생성합니다."""
        return f"webrtc:answer:senior:{senior_id}"

    async def _register_sdp(self, key: str, packet: Dict[str, Any], sdp_type: str):
        """
        SDP(Offer/Answer) 패킷을 만료 시간과 함께 Redis에 등록합니다.
        """
        redis_client = await self.red_sess.get_client()
        # ❗ 변경점: ex=SDP_EXPIRATION_SECONDS를 추가하여 300초 후 자동 만료되도록 설정
        await redis_client.set(
            key, 
            json.dumps(packet), 
            ex=SDP_EXPIRATION_SECONDS
        )
        print(f"Registered {sdp_type} with key '{key}' (expires in {SDP_EXPIRATION_SECONDS}s)")

    async def register_offer(self, senior_id: int, offer_packet: Dict[str, Any]):
        key = self._get_offer_key(senior_id)
        await self._register_sdp(key, offer_packet, "Offer")

    async def register_answer(self, senior_id: int, answer_packet: Dict[str, Any]):
        key = self._get_answer_key(senior_id)
        await self._register_sdp(key, answer_packet, "Answer")

    async def consume_sdp(self, key: str, sdp_type: str) -> Optional[Dict[str, Any]]:
        """

        SDP(Offer/Answer) 패킷을 조회하고 즉시 삭제합니다. (GETDEL 사용)
        """
        redis_client = await self.red_sess.get_client()
        # ❗ 변경점: .get() 대신 .getdel()을 사용하여 값을 읽음과 동시에 키를 삭제
        data_bytes = await redis_client.getdel(key)
        
        if data_bytes:
            print(f"Consumed {sdp_type} from key '{key}'")
            return json.loads(data_bytes)
        
        print(f"No {sdp_type} found for key '{key}'")
        return None

    async def consume_offer(self, senior_id: int) -> Optional[Dict[str, Any]]:
        key = self._get_offer_key(senior_id)
        return await self.consume_sdp(key, "Offer")

    async def consume_answer(self, senior_id: int) -> Optional[Dict[str, Any]]:
        key = self._get_answer_key(senior_id)
        return await self.consume_sdp(key, "Answer")