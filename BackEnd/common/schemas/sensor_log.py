from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, field_validator

from common.models.enums import SensorTypeEnum


class SensorLogInfo(BaseModel):
    """테이블에서 로그를 입출력하는 형식"""

    timestamp: datetime
    sensor_type: SensorTypeEnum
    sensor_value: bool
    event_description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("sensor_type", mode="before")
    @classmethod
    def to_enum_member(cls, v: Any) -> SensorTypeEnum:
        """
        문자열로 들어온 값을 SensorTypeEnum 멤버로 변환합니다.
        Enum의 '이름' (e.g., 'PIR_LIVINGROOM')으로도 조회하고,
        '값' (e.g., 'pir_livingroom')으로도 조회할 수 있도록 처리합니다.
        """
        if isinstance(v, str):
            try:
                # 1. Enum의 '이름'으로 먼저 찾아봅니다. (e.g., SensorTypeEnum['PIR_LIVINGROOM'])
                return SensorTypeEnum[v]
            except KeyError:
                # 2. '이름'으로 찾지 못하면, Pydantic 기본 검증이 '값'으로 찾도록 값을 그대로 반환합니다.
                pass
        return v


class SensorLogList(BaseModel):
    """외부로 반환할 로그 데이터 형태"""

    # SQLModel 객체로부터 값을 읽어올 수 있도록 설정
    senior_id: int
    log_list: list[SensorLogInfo]

    model_config = ConfigDict(from_attributes=True)
