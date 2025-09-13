from datetime import datetime
import os
from dotenv import load_dotenv
import hashlib
import secrets
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, ConfigDict, field_validator
from sqlmodel import SQLModel, Field, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from common.models.enums import SensorTypeEnum
from common.models.iot_models import SensorLog

class SensorLogInfo(BaseModel):
    """테이블에서 로그를 입출력하는 형식"""
    timestamp: datetime
    sensor_type: SensorTypeEnum
    sensor_value: bool
    event_description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator('sensor_type', mode='before')
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
    
class SensorLogManager:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add_logs(self, senior_id: int, logs_data: List[SensorLogInfo]) -> None:
        """
        여러 개의 센서 로그를 데이터베이스에 한 번의 쿼리로 효율적으로 추가합니다.
        TimescaleDB의 대량 삽입(bulk insert) 성능을 활용합니다.
        """
        if not logs_data:
            return

        # Pydantic 모델 리스트를 DB에 삽입할 딕셔너리 리스트로 변환
        values_to_insert = [
            {
                "senior_id": senior_id,
                "timestamp": log.timestamp,
                "sensor_type": log.sensor_type.value, # Enum 멤버의 실제 값 사용
                "sensor_value": log.sensor_value,
                "event_description": log.event_description,
            }
            for log in logs_data
        ]
        
        # SQLModel/SQLAlchemy의 insert 문을 사용하여 안전하고 효율적으로 데이터를 삽입
        # on_conflict_do_nothing()은 혹시 모를 중복 데이터(PK 충돌) 발생 시 무시하고 넘어감
        stmt = pg_insert(SensorLog).values(values_to_insert).on_conflict_do_nothing()

        await self.session.execute(stmt)

    async def get_logs_by_senior_id(self, senior_id: int) -> SensorLogList:
        """
        특정 어르신의 모든 센서 로그를 시간 역순으로 조회하여 SensorLogList 형태로 반환합니다.
        """
        query = text(
            """
            SELECT timestamp, sensor_type, sensor_value, event_description
            FROM sensor_logs
            WHERE senior_id = :senior_id
            ORDER BY timestamp DESC
            """
        )
        
        result = await self.session.execute(query, {"senior_id": senior_id})
        retrieved_logs_rows = result.all()

        # DB에서 조회한 Row 객체 리스트를 Pydantic(SensorLogInfo) 모델 리스트로 변환
        log_info_list = [SensorLogInfo.model_validate(row) for row in retrieved_logs_rows]
        
        # 최종 반환 형식인 SensorLogList 모델로 감싸서 반환
        return SensorLogList(senior_id=senior_id, log_list=log_info_list)