from typing import List
from sqlmodel import text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from common.models.iot_models import SensorLog
from common.modules.user_manager import UserManager
from common.schemas.sensor_log import SensorLogInfo, SensorLogList


class SensorLogManager:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_man = UserManager(session)

    async def add_logs(self, senior_id: int, logs_data: List[SensorLogInfo]) -> None:
        """
        여러 개의 센서 로그를 데이터베이스에 한 번의 쿼리로 효율적으로 추가합니다.
        TimescaleDB의 대량 삽입(bulk insert) 성능을 활용합니다.
        """
        is_id_exit =  await self.user_man.get_senior_info_by_id(senior_id)
        if not logs_data or not is_id_exit:
            raise ValueError(f"add_logs - Invalid senior_id: {senior_id}")

        values_to_insert = [
            {
                "senior_id": senior_id,
                "timestamp": log.timestamp,
                "sensor_type": log.sensor_type.value,  # Enum 멤버의 실제 값 사용
                "sensor_value": log.sensor_value,
                "event_description": log.event_description,
            }
            for log in logs_data
        ]

        stmt = pg_insert(SensorLog).values(values_to_insert).on_conflict_do_nothing()

        await self.session.execute(stmt)

    async def get_logs_by_senior_id(self, senior_id: int) -> SensorLogList:
        """
        특정 어르신의 모든 센서 로그를 시간 역순으로 조회하여 SensorLogList 형태로 반환합니다.
        """
        is_id_exit = await self.user_man.get_senior_info_by_id(senior_id)
        if not is_id_exit:
            # None을 반환하는 대신, 비어있는 SensorLogList를 반환
            return SensorLogList(senior_id=senior_id, log_list=[])
        
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

        log_info_list = [
            SensorLogInfo.model_validate(row) for row in retrieved_logs_rows
        ]

        return SensorLogList(senior_id=senior_id, log_list=log_info_list)
