from datetime import datetime
from dotenv import load_dotenv
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, ConfigDict, field_validator
from sqlmodel import SQLModel, Field, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession


from common.models.iot_models import SensorLog
from common.schemas.sensor_log import SensorLogInfo, SensorLogList


    
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