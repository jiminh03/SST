import redis.asyncio as redis
import json
from typing import Optional, Type, Union
from common.modules.db_manager import RedisSessionManager


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

    async def register_offer(self, senior_id: int, offer_packet):
        """
        Offer 패킷을 senior_id를 키로 사용하여 Redis에 등록합니다.
        """
        # 1. 비동기적으로 Redis 클라이언트를 가져옵니다.
        redis_client = await self.red_sess.get_client()
        
        key = self._get_offer_key(senior_id)
        
        # 2. 가져온 클라이언트를 사용하여 Redis 명령을 실행합니다.
        await redis_client.set(key, json.dumps(offer_packet))
        print(f"Registered offer for senior {senior_id} with key '{key}'")

    async def register_answer(self, senior_id: int, answer_packet):
        """
        Answer 패킷을 senior_id를 키로 사용하여 Redis에 등록합니다.
        """
        # 1. 비동기적으로 Redis 클라이언트를 가져옵니다.
        redis_client = await self.red_sess.get_client()

        key = self._get_answer_key(senior_id)
        
        # 2. 가져온 클라이언트를 사용하여 Redis 명령을 실행합니다.
        await redis_client.set(key, json.dumps(answer_packet))
        print(f"Registered answer for senior {senior_id} with key '{key}'")

    async def get_offer(self, senior_id: int):
        """
        Redis에서 Offer 패킷을 조회합니다.
        """
        # 1. 비동기적으로 Redis 클라이언트를 가져옵니다.
        redis_client = await self.red_sess.get_client()

        key = self._get_offer_key(senior_id)
        
        # 2. 가져온 클라이언트를 사용하여 Redis 명령을 실행합니다.
        data = await redis_client.get(key)
        
        if data:
            print(f"Found offer for senior {senior_id} with key '{key}'")
            return data
            
        print(f"No offer found for senior {senior_id} with key '{key}'")
        return None

    async def get_answer(self, senior_id: int):
        """
        Redis에서 Answer 패킷을 조회합니다.
        """
        # 1. 비동기적으로 Redis 클라이언트를 가져옵니다.
        redis_client = await self.red_sess.get_client()

        key = self._get_answer_key(senior_id)
        
        # 2. 가져온 클라이언트를 사용하여 Redis 명령을 실행합니다.
        data = await redis_client.get(key)
        
        if data:
            print(f"Found answer for senior {senior_id} with key '{key}'")
            return data
            
        print(f"No answer found for senior {senior_id} with key '{key}'")
        return None