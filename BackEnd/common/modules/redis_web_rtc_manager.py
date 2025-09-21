import redis.asyncio as redis
import json
from typing import Optional, Type, Union
from common.schemas.rtc_payloads import (
    WebRTCRobotOffer,
    WebRTCRobotAnswer,
    WebRTCFEOffer,
    WebRTCFEAnswer
)

OfferPacket = Union[WebRTCRobotOffer, WebRTCFEOffer]
AnswerPacket = Union[WebRTCRobotAnswer, WebRTCFEAnswer]
OfferPacketType = Type[OfferPacket]
AnswerPacketType = Type[AnswerPacket]

class RedisWebRTCManager:
    """Redis에 WebRTC 패킷을 등록하고 조회하는 작업을 관리합니다."""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def _get_offer_key(self, senior_id: int) -> str:
        """Offer에 대한 Redis 키를 생성합니다."""
        return f"webrtc:offer:senior:{senior_id}"

    def _get_answer_key(self, senior_id: int) -> str:
        """Answer에 대한 Redis 키를 생성합니다."""
        return f"webrtc:answer:senior:{senior_id}"

    def register_offer(self, senior_id: int, offer_packet: OfferPacket):
        """
        Offer 패킷을 senior_id를 키로 사용하여 Redis에 등록합니다.

        Args:
            senior_id: 시니어의 ID입니다.
            offer_packet: 등록할 Offer 패킷입니다.
        """
        key = self._get_offer_key(senior_id)
        self.redis.set(key, offer_packet.to_json())
        print(f"Registered offer for senior {senior_id} with key '{key}'")

    def register_answer(self, senior_id: int, answer_packet: AnswerPacket):
        """
        Answer 패킷을 senior_id를 키로 사용하여 Redis에 등록합니다.

        Args:
            senior_id: 시니어의 ID입니다.
            answer_packet: 등록할 Answer 패킷입니다.
        """
        key = self._get_answer_key(senior_id)
        self.redis.set(key, answer_packet.to_json())
        print(f"Registered answer for senior {senior_id} with key '{key}'")

    def get_offer(self, senior_id: int, packet_type: OfferPacketType) -> Optional[OfferPacket]:
        """
        Redis에서 Offer 패킷을 조회하고 역직렬화합니다.

        Args:
            senior_id: 시니어의 ID입니다.
            packet_type: 역직렬화할 패킷의 클래스입니다 (예: WebRTCRobotOffer).

        Returns:
            지정된 packet_type의 인스턴스를 반환하며, 찾지 못한 경우 None을 반환합니다.
        """
        key = self._get_offer_key(senior_id)
        data = self.redis.get(key)
        if data:
            print(f"Found offer for senior {senior_id} with key '{key}'")
            return packet_type.from_dict(json.loads(data))
        print(f"No offer found for senior {senior_id} with key '{key}'")
        return None

    def get_answer(self, senior_id: int, packet_type: AnswerPacketType) -> Optional[AnswerPacket]:
        """
        Redis에서 Answer 패킷을 조회하고 역직렬화합니다.

        Args:
            senior_id: 시니어의 ID입니다.
            packet_type: 역직렬화할 패킷의 클래스입니다 (예: WebRTCFEAnswer).

        Returns:
            지정된 packet_type의 인스턴스를 반환하며, 찾지 못한 경우 None을 반환합니다.
        """
        key = self._get_answer_key(senior_id)
        data = self.redis.get(key)
        if data:
            print(f"Found answer for senior {senior_id} with key '{key}'")
            return packet_type.from_dict(json.loads(data))
        print(f"No answer found for senior {senior_id} with key '{key}'")
        return None
    
# --- 사용 예시 ---
async def main():
    """메인 비동기 함수"""
    # 로컬 Redis 인스턴스에 연결합니다.
    try:
        redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        await redis_client.ping()
        print("Redis에 성공적으로 연결되었습니다.")
    except redis.exceptions.ConnectionError as e:
        print(f"Redis 연결에 실패했습니다: {e}")
        return

    manager = RedisWebRTCManager(redis_client)

    # --- 예시 데이터 생성 ---
    senior_id_1 = 123
    senior_id_2 = 456

    # 123번 시니어에 대해 로봇이 Offer를 생성
    robot_offer = WebRTCRobotOffer(
        api_key="robot-api-key-abc",
        offer_sdp={"type": "offer", "sdp": "robot_offer_sdp_for_123"}
    )

    # 456번 시니어에 대해 FE가 Offer를 생성
    fe_offer = WebRTCFEOffer(
        senior_id=senior_id_2,
        offer_sdp={"type": "offer", "sdp": "fe_offer_sdp_for_456"}
    )
    
    # 123번 시니어에 대해 FE가 Answer를 생성
    fe_answer = WebRTCFEAnswer(
        senior_id=senior_id_1,
        answer_sdp="fe_answer_sdp_for_123"
    )

    print("\n--- 1. 패킷 등록 테스트 ---")
    await manager.register_offer(senior_id=senior_id_1, offer_packet=robot_offer)
    await manager.register_offer(senior_id=senior_id_2, offer_packet=fe_offer)
    await manager.register_answer(senior_id=senior_id_1, answer_packet=fe_answer)
    
    print("\n--- 2. 패킷 조회 테스트 ---")
    
    # 123번 시니어의 로봇 Offer 조회
    retrieved_robot_offer = await manager.get_offer(senior_id_1, WebRTCRobotOffer)
    if retrieved_robot_offer:
        print(f"조회된 로봇 Offer (Senior {senior_id_1}):")
        print(f"  API Key: {retrieved_robot_offer.api_key}")
        print(f"  SDP: {retrieved_robot_offer.offer_sdp}")

    print("-" * 20)
    
    # 123번 시니어의 FE Answer 조회
    retrieved_fe_answer = await manager.get_answer(senior_id_1, WebRTCFEAnswer)
    if retrieved_fe_answer:
        print(f"조회된 FE Answer (Senior {senior_id_1}):")
        print(f"  Senior ID: {retrieved_fe_answer.senior_id}")
        print(f"  SDP: {retrieved_fe_answer.answer_sdp}")
        
    print("-" * 20)
        
    # 존재하지 않는 456번 시니어의 Answer 조회
    non_existent_answer = await manager.get_answer(senior_id_2, WebRTCRobotAnswer)
    print(f"존재하지 않는 Answer 조회 결과 (Senior {senior_id_2}): {non_existent_answer}")

    # Redis 연결 종료
    await redis_client.close()

