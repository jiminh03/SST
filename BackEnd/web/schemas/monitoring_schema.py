from pydantic import BaseModel, computed_field
from typing import List, Optional
from datetime import date, datetime

from common.models.enums import SensorTypeEnum

from common.modules.user_manager import SeniorInfo

from pydantic import BaseModel, computed_field
from typing import List, Optional
from datetime import datetime


class SeniorSimpleInfo(BaseModel):
    # SeniorInfo로부터 직접 매핑될 필드들
    senior_id: int
    full_name: str
    address: str
    birth_date: date

    # Config 설정은 Pydantic이 객체 속성에서 값을 읽도록 합니다.
    class Config:
        from_attributes = True

    # profile_img 필드는 senior_id가 정해진 후에 계산됩니다.
    @computed_field
    @property
    def profile_img(self) -> Optional[str]:
        # senior_id를 사용하여 이미지 URL을 동적으로 생성합니다.
        # 이미지가 없는 경우를 대비해 None을 반환할 수도 있습니다.
        return f"https://j13a503.p.ssafy.io/api/seniors/{self.senior_id}/profile-image"

class SeniorDetail(SeniorInfo):
    profile_img:Optional[str]=None

class EmergencyLog(BaseModel):
    log_id: int
    timestamp: datetime
    description: str

class SensorLogInfo(BaseModel):
    """테이블에서 로그를 입출력하는 형식"""
    timestamp: datetime
    sensor_type: SensorTypeEnum
    sensor_value: bool
    event_description: Optional[str] = None

    class Config:
        from_attributes = True

class SensorLogList(BaseModel):
    """외부로 반환할 로그 데이터 형태"""
    senior_id: int
    log_list: List[SensorLogInfo]

    class Config:
        from_attributes = True



class FrontendSensorItem(BaseModel):
    """프론트엔드로 보낼 개별 센서의 상태 정보"""
    sensor_id: str      # 예: "door_bedroom"
    sensor_type: str    # 예: "door"
    location: str       # 예: "bedroom"
    value: bool         # 예: true
    last_updated: datetime

    # Config 설정은 Pydantic이 객체 속성에서 값을 읽도록 합니다.
    class Config:
        from_attributes = True

    @computed_field
    @property
    def status(self) -> str:
        """sensor_value(bool)를 기반으로 'active' 또는 'inactive' 상태를 계산합니다."""
        return "active" if self.value else "inactive"

class FrontendSensorStatusPayload(BaseModel):
    """최종적으로 프론트엔드에 전달될 전체 센서 상태 페이로드"""
    senior_id: int
    sensors: List[FrontendSensorItem]

    class Config:
        from_attributes = True

    @computed_field
    @property
    def last_updated(self) -> Optional[datetime]:
        """센서 목록 중 가장 최근의 timestamp를 찾아 반환합니다."""
        if not self.sensors:
            return None
        return max(sensor.last_updated for sensor in self.sensors)
    
