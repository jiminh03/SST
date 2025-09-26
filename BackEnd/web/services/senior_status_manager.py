from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum

from web.schemas.monitoring_schema import FrontendSensorItem, FrontendSensorStatusPayload, RiskLevel, SeniorStatus
from common.modules.db_manager import RedisSessionManager
from web.services.data_alarm import notify_senior_status_change


class SeniorStatusManager:
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
            senior_id=senior_id,
            status=status,
            reason=reason,
            last_updated=update_time
        )
        
        redis_key = f"senior:{senior_id}:status"
        
        # Pydantic 모델을 dict로 변환하여 red_sess Hash에 저장
        # datetime 객체는 ISO 8601 문자열로 변환
        status_dict = new_status.model_dump(mode='json')
        
        await redis_client.hmset(redis_key, status_dict)

        await notify_senior_status_change(senior_id, new_status)

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
    

class SensorStatusManager:
    """센서 상태를 Redis에 저장하고 관리하는 클래스"""

    def __init__(self, redis_session_manager:RedisSessionManager):
        self.red_sess = redis_session_manager
        self.key_prefix = "sensor:status"

    def _get_key(self, senior_id: int, sensor_id: str) -> str:
        return f"{self.key_prefix}:{senior_id}:{sensor_id}"

    async def update_all_sensor_statuses(self, payload: FrontendSensorStatusPayload):
        """
        [WRITE] FrontendSensorStatusPayload 전체를 받아 Redis에 모든 센서 상태를 저장/업데이트합니다.
        """
        red = await self.red_sess.get_client()
        async with red.pipeline() as pipe:
            for sensor_item in payload.sensors:
                redis_key = self._get_key(payload.senior_id, sensor_item.sensor_id)
                
                data_to_store = {
                    "sensor_type": sensor_item.sensor_type,
                    "location": sensor_item.location,
                    "value": "1" if sensor_item.value else "0",
                    "last_updated": sensor_item.last_updated.isoformat()
                }
                await pipe.hset(redis_key, mapping=data_to_store)
            
            await pipe.execute()
        
        print(f"✅ Wrote {len(payload.sensors)} sensor statuses for senior_id: {payload.senior_id}")

    async def get_all_sensor_statuses(self, senior_id: int) -> Optional[FrontendSensorStatusPayload]:
        """
        [READ] senior_id에 해당하는 모든 센서 상태를 Redis에서 읽어
        FrontendSensorStatusPayload 객체로 재구성하여 반환합니다.
        """
        red = await self.red_sess.get_client()
        # 1. SCAN 명령어로 senior_id에 해당하는 모든 센서 키를 찾습니다.
        #    KEYS 명령어보다 안전하고 효율적입니다.
        key_pattern = f"{self.key_prefix}:{senior_id}:*"
        sensor_keys = [key async for key in red.scan_iter(match=key_pattern)]

        if not sensor_keys:
            return None # 해당 어르신의 센서 데이터가 없음

        # 2. Pipeline을 사용해 모든 키의 Hash 데이터를 한 번에 가져옵니다.
        async with red.pipeline() as pipe:
            for key in sensor_keys:
                await pipe.hgetall(key)
            results = await pipe.execute()

        # 3. 가져온 데이터를 FrontendSensorItem 객체 리스트로 재구성합니다.
        sensor_items: List[FrontendSensorItem] = []
        for key, data in zip(sensor_keys, results):
            if not data: continue

            # 4. Redis 문자열 데이터를 파이썬 타입으로 역직렬화(Deserialization)합니다.
            try:
                sensor_id = key.split(':')[-1] # 키에서 sensor_id 추출
                
                sensor_item = FrontendSensorItem(
                    sensor_id=sensor_id,
                    sensor_type=data.get('sensor_type', 'unknown'),
                    location=data.get('location', 'unknown'),
                    value=data.get('value') == '1',
                    last_updated=datetime.fromisoformat(data['last_updated'])
                )
                sensor_items.append(sensor_item)
            except (KeyError, ValueError) as e:
                print(f"⚠️ Error parsing data for key {key}: {e}")
                continue
        
        # 5. 최종 페이로드 객체를 만들어 반환합니다.
        return FrontendSensorStatusPayload(senior_id=senior_id, sensors=sensor_items)