from datetime import datetime
import os
from dotenv import load_dotenv
import hashlib
import secrets
from typing import Optional, Dict, Any

from pydantic import BaseModel, ConfigDict
from sqlmodel import SQLModel, Field, text
from sqlalchemy.ext.asyncio import AsyncSession

from common.models.enums import SensorTypeEnum

class SensorLogInfo(BaseModel):
    """테이블에서 로그를 입출력하는 형식"""
    timestamp: datetime
    sensor_type: SensorTypeEnum
    sensor_value: bool
    event_description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
    
    

class SensorLogList(BaseModel):
    """외부로 반환할 로그 데이터 형태"""
    # SQLModel 객체로부터 값을 읽어올 수 있도록 설정
    hub_id: int
    log_list: list[SensorLogInfo]

    model_config = ConfigDict(from_attributes=True)
    
class SensorLogManager:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add_log(self, log_data: Dict[str, Any]) -> None:
        """센서 로그를 데이터베이스에 추가합니다."""
        # 이 부분은 실제 SensorLog 모델과 스키마에 따라 구현해야 합니다.
        # 예시:
        # new_log = SensorLog(**log_data)
        # self.session.add(new_log)
        # await self.session.flush()
        print(f"로그 추가 (구현 필요): {log_data}")