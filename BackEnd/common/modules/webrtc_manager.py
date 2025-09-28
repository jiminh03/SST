import redis.asyncio as redis
import json
from typing import Any, Dict, Optional, Type, Union
from common.modules.db_manager import RedisSessionManager

SDP_EXPIRATION_SECONDS = 300

class WebRTCManager:
    """Redis에 WebRTC 패킷을 등록하고 조회하는 작업을 관리합니다."""

    def __init__(self, redis_session_manager: RedisSessionManager):
        self.red_sess = redis_session_manager

    def _get_offer_key(self, senior_id: int) -> str:
        return f"webrtc:offer:senior:{senior_id}"

    def _get_answer_key(self, senior_id: int) -> str:
        return f"webrtc:answer:senior:{senior_id}"

    async def _register_sdp(self, key: str, packet: Dict[str, Any], sdp_type: str):
        redis_client = await self.red_sess.get_client()
        await redis_client.set(
            key, 
            json.dumps(packet), 
            ex=SDP_EXPIRATION_SECONDS
        )
        print(f"Registered {sdp_type} with key '{key}' (expires in {SDP_EXPIRATION_SECONDS}s)")

    async def register_offer(self, senior_id: int, offer_packet: Dict[str, Any]):
        key = self._get_offer_key(senior_id)
        print("register_offer")
        await self._register_sdp(key, offer_packet, "Offer")

    async def register_answer(self, senior_id: int, answer_packet: Dict[str, Any]):
        key = self._get_answer_key(senior_id)
        print("register_answer")
        await self._register_sdp(key, answer_packet, "Answer")

    async def consume_sdp(self, key: str, sdp_type: str) -> Optional[Dict[str, Any]]:
        """
        SDP(Offer/Answer) 패킷을 조회하고 즉시 삭제한 뒤,
        파싱된 파이썬 딕셔너리로 반환합니다.
        """
        redis_client = await self.red_sess.get_client()
        data_str = await redis_client.getdel(key)
        
        if data_str:
            print(f"Consumed {sdp_type} from key '{key}'")
            # ❗ Redis에서 가져온 JSON 문자열을 파이썬 딕셔너리로 파싱합니다.
            return json.loads(data_str)
        
        print(f"No {sdp_type} found for key '{key}'")
        return None

    async def consume_offer(self, senior_id: int) -> Optional[Dict[str, Any]]:
        key = self._get_offer_key(senior_id)
        print("consume_offer")
        return await self.consume_sdp(key, "Offer")

    async def consume_answer(self, senior_id: int) -> Optional[Dict[str, Any]]:
        key = self._get_answer_key(senior_id)
        print("consume_answer")
        return await self.consume_sdp(key, "Answer")