import redis.asyncio as redis
import json
from typing import Optional, Type, Union
from common.schemas.rtc_payloads import (
    WebRTCRobotOffer,
    WebRTCFEAnswer
)

class WebRTCManager:
    """Redis에 WebRTC 패킷을 등록하고 조회하는 작업을 관리합니다."""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def _get_offer_key(self, senior_id: int) -> str:
        """Offer에 대한 Redis 키를 생성합니다."""
        return f"webrtc:offer:senior:{senior_id}"

    def _get_answer_key(self, senior_id: int) -> str:
        """Answer에 대한 Redis 키를 생성합니다."""
        return f"webrtc:answer:senior:{senior_id}"

    async def register_offer(self, senior_id: int, offer_packet: WebRTCRobotOffer):
        """
        Offer 패킷을 senior_id를 키로 사용하여 Redis에 등록합니다.

        Args:
            senior_id: 시니어의 ID입니다.
            offer_packet: 등록할 Offer 패킷입니다.
        """
        key = self._get_offer_key(senior_id)
        await self.redis.set(key, offer_packet.to_json())
        print(f"Registered offer for senior {senior_id} with key '{key}'")

    async def register_answer(self, senior_id: int, answer_packet: WebRTCFEAnswer):
        """
        Answer 패킷을 senior_id를 키로 사용하여 Redis에 등록합니다.

        Args:
            senior_id: 시니어의 ID입니다.
            answer_packet: 등록할 Answer 패킷입니다.
        """
        key = self._get_answer_key(senior_id)
        await self.redis.set(key, answer_packet.to_json())
        print(f"Registered answer for senior {senior_id} with key '{key}'")

    async def get_offer(self, senior_id: int) -> Optional[WebRTCRobotOffer]:
        """
        Redis에서 Offer 패킷을 조회하고 역직렬화합니다.

        Args:
            senior_id: 시니어의 ID입니다.
            packet_type: 역직렬화할 패킷의 클래스입니다 (예: WebRTCRobotOffer).

        Returns:
            지정된 packet_type의 인스턴스를 반환하며, 찾지 못한 경우 None을 반환합니다.
        """
        key = self._get_offer_key(senior_id)
        data = await self.redis.get(key)
        if data:
            print(f"Found offer for senior {senior_id} with key '{key}'")
            return WebRTCRobotOffer.from_dict(json.loads(data))
        print(f"No offer found for senior {senior_id} with key '{key}'")
        return None

    async def get_answer(self, senior_id: int) -> Optional[WebRTCFEAnswer]:
        """
        Redis에서 Answer 패킷을 조회하고 역직렬화합니다.

        Args:
            senior_id: 시니어의 ID입니다.
            packet_type: 역직렬화할 패킷의 클래스입니다 (예: WebRTCFEAnswer).

        Returns:
            지정된 packet_type의 인스턴스를 반환하며, 찾지 못한 경우 None을 반환합니다.
        """
        key = self._get_answer_key(senior_id)
        data = await self.redis.get(key)
        if data:
            print(f"Found answer for senior {senior_id} with key '{key}'")
            return WebRTCFEAnswer.from_dict(json.loads(data))
        print(f"No answer found for senior {senior_id} with key '{key}'")
        return None
    