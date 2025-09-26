from pydantic import BaseModel
from typing import Optional

class HubCreate(BaseModel):
    """'add_hub'에 사용할 입력 모델"""

    device_id: str
    senior_id: Optional[int] = None
    api_key_hash: Optional[str] = None


class HubUpdate(BaseModel):
    """'edit_hub_info'에 사용할 입력 모델"""

    device_id: Optional[str] = None
    senior_id: Optional[int] = None
    api_key_hash: Optional[str] = None
    status: Optional[str] = None


class HubStatus(BaseModel):
    """get_hub_status 메서드의 반환 타입을 명시하기 위한 내부 모델"""

    status: str


class HubBasicInfo(BaseModel):
    """get_hub_info 메서드의 반환 타입을 명시하기 위한 내부 모델"""

    hub_id: int
    senior_id: Optional[int]
    device_id: Optional[str] = None
    status: Optional[str] = None
    api_key_hash: Optional[str] = None