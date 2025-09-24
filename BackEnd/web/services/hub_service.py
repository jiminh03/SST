import os
from datetime import datetime, timedelta, timezone
from typing import Annotated, List, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from common.modules.api_key_manager import ApiKeyRepository
from common.modules.user_manager import UserManager
from web.services.database import db
from web.schemas.iot_schema import SensorLogPayload  # 입력 스키마
from web.schemas.monitoring_schema import (
    FrontendSensorItem,
    FrontendSensorStatusPayload,
)  # 출력 스키마
from common.modules.api_key_manager import ApiKeyRepository  # DB 조회를 위한 리포지토리


class HubService:
    def __init__(self, api_key_repo: ApiKeyRepository):
        self.api_key_repo = api_key_repo

    async def get_hub_from_api_key(self, api_key):
        hub = await self.api_key_repo.get_hub_by_api_key(api_key)

        if not hub:
            return None
        return hub


class SensorDataService:
    def __init__(self, session):
        self.session = session
        self.apikey_repo = ApiKeyRepository(session)

    async def transform_sensor_data(
        self, payload: SensorLogPayload
    ) -> FrontendSensorStatusPayload:
        """
        수신된 센서 로그를 프론트엔드가 사용하기 좋은 형태로 변환합니다.
        """
        # 1. API 키를 사용하여 senior_id를 조회합니다.
        hub = await self.apikey_repo.get_hub_by_api_key(payload.api_key)
        if not hub or not hub.senior_id:
            raise ValueError("Invalid API Key or Senior not linked")

        senior_id = hub.senior_id

        frontend_sensors: List[FrontendSensorItem] = []
        for item in payload.sensor_data:

            # 2. SensorTypeEnum 값(예: "door_bedroom")을 파싱합니다.
            sensor_enum_value = item.sensor_type.value  # Enum 값을 문자열로 변환
            parts = sensor_enum_value.split("_", 1)
            sensor_type = parts[0]
            # '_'가 없는 경우를 대비하여 안전하게 처리
            location = parts[1] if len(parts) > 1 else "unknown"

            # 3. FrontendSensorItem 객체를 생성합니다.
            frontend_item = FrontendSensorItem(
                sensor_id=sensor_enum_value,
                sensor_type=sensor_type,
                location=location,
                value=item.sensor_value,
                last_updated=item.timestamp,
            )
            frontend_sensors.append(frontend_item)

        # 4. 최종 출력 모델을 생성하여 반환합니다.
        return FrontendSensorStatusPayload(
            senior_id=senior_id, sensors=frontend_sensors
        )
