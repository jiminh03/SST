from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel

from common.models.enums import SensorTypeEnum


class SensorDataItem(BaseModel):
    """개별 센서 데이터의 형식을 정의하는 모델"""
    sensor_type: SensorTypeEnum
    sensor_value: bool
    event_description: Optional[str] = None
    timestamp: datetime

class SensorLogPayload(BaseModel):
    """
    IoT 허브에서 수신하는 전체 센서 이벤트 로그의 형식을 정의하는 메인 모델
    
    YAML 스키마의 properties에는 'api_key'가 있었지만,
    required 필드에 'hub_id'가 명시되어 있어 이를 따랐습니다.
    """
    api_key: str
    sensor_data: List[SensorDataItem]

class SeniorIdRequest(BaseModel):
    api_key: str

class SeniorIdResponse(BaseModel):
    senior_id: int
