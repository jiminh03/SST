# common/models/iot_models.py
import datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel
from enums import SensorTypeEnum

class IoTHub(SQLModel, table=True):
    """어르신 댁에 설치된 IoT 허브 기기 정보를 저장하는 테이블"""
    __tablename__ = "iot_hubs"

    hub_id: Optional[int] = Field(default=None, primary_key=True)
    unique_id: str = Field(unique=True, index=True, description="기기 고유 번호 (e.g., MAC 주소)")
    api_key_hash: str = Field(description="발급된 API 키의 해시값")
    status: str = Field(default="offline", description="상태 (e.g., online, offline)")
    last_seen_at: Optional[datetime.datetime] = Field(default=None)
    registered_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow, nullable=False
    )

    # 어느 어르신에게 할당된 허브인지 명시 (일대일 관계)
    senior_id: int = Field(foreign_key="seniors.senior_id", unique=True)
    senior: "Senior" = Relationship(back_populates="iot_hub")

class SensorLog(SQLModel, table=True):
    """
    센서 이벤트 로그를 저장하는 시계열 테이블 (TimescaleDB Hypertable용)
    
    참고: 이 테이블은 생성 후 TimescaleDB의 'create_hypertable' 함수를 사용하여
    하이퍼테이블로 전환해야 합니다.
    ex) SELECT create_hypertable('sensorlog', 'timestamp');
    """
    __tablename__ = "sensor_logs"

    timestamp: datetime.datetime = Field(
        primary_key=True, 
        description="이벤트 발생 타임스탬프 (Primary Key)"
    )
    
    sensor_type: SensorTypeEnum = Field(
        index=True, 
        description="센서 위치 또는 고유 ID"
    )
    
    sensor_value: bool = Field(
        description="센서의 상태 값 (True/False)"
    )
    
    event_description: Optional[str] = Field(
        default=None,
        description="이벤트 내용"
    )

    senior_id: int = Field(
        foreign_key="seniors.senior_id", 
        index=True,
        description="로그를 남긴 어르신 ID"
    )