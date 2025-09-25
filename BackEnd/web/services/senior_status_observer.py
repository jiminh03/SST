from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum

from web.schemas.monitoring_schema import RiskLevel, SeniorStatus
from common.modules.db_manager import RedisSessionManager

class SeniorStatusObserver:
    """어르신 상태를 관찰하고 Redis에 저장하는 클래스"""

    def __init__(self, redis_session_manager:RedisSessionManager):
        self.red_sess = redis_session_manager

    async def update_status(self, senior_id: int, status: RiskLevel, reason: str):
        """
        어르신의 현재 상태(위험도)를 Redis에 갱신합니다.

        Args:
            senior_id (int): 어르신 고유 ID
            status (RiskLevel): 위험도 수준
            reason (str): 상태 변경 이유
        """
        redis_client = await self.red_sess.get_client()

        korea_time = timezone(datetime.now().astimezone().utcoffset())
        update_time = datetime.now(korea_time)

        new_status = SeniorStatus(
            status=status,
            reason=reason,
            last_updated=update_time
        )
        
        redis_key = f"senior:{senior_id}:status"
        
        # Pydantic 모델을 dict로 변환하여 red_sess Hash에 저장
        # datetime 객체는 ISO 8601 문자열로 변환
        status_dict = new_status.model_dump(mode='json')
        
        await redis_client.hmset(redis_key, status_dict)
        print(f"✅ [상태 갱신] 어르신 ID: {senior_id}, 상태: {status.value}, 이유: {reason}")

    async def get_status(self, senior_id: int) -> Optional[SeniorStatus]:
        """
        Redis에서 어르신의 현재 상태를 조회합니다.

        Args:
            senior_id (int): 어르신 고유 ID

        Returns:
            Optional[SeniorStatus]: 어르신 상태 정보. 없으면 None을 반환합니다.
        """
        redis_client = await self.red_sess.get_client()
        
        redis_key = f"senior:{senior_id}:status"
        status_data = await redis_client.hgetall(redis_key)

        if not status_data:
            return None
        
        # Redis에서 읽은 데이터는 모두 바이트 문자열이므로 디코딩 필요
        decoded_data = {k.decode('utf-8'): v.decode('utf-8') for k, v in status_data.items()}
        
        return SeniorStatus(**decoded_data)