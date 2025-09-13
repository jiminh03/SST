import os
from dotenv import load_dotenv
import hashlib
import secrets
from typing import Optional, Dict, Any

from pydantic import BaseModel
from sqlmodel import SQLModel, Field, text
from sqlalchemy.ext.asyncio import AsyncSession

from common.models.iot_models import IoTHub

load_dotenv(dotenv_path=".env")

class HubCreate(BaseModel):
    """'add_hub'에 사용할 입력 모델"""
    unique_id: str
    senior_id: Optional[int] = None
    api_key_hash: Optional[str] = None

class HubUpdate(BaseModel):
    """'edit_hub_info'에 사용할 입력 모델"""
    unique_id: Optional[str] = None
    senior_id: Optional[int] = None
    api_key_hash: Optional[str] = None
    status: Optional[str] = None

class HubStatus(BaseModel):
    """get_hub_status 메서드의 반환 타입을 명시하기 위한 내부 모델"""
    status: str

class HubBasicInfo(BaseModel):
    """get_hub_info 메서드의 반환 타입을 명시하기 위한 내부 모델"""
    hub_id: int
    unique_id: Optional[str] = None
    status: Optional[str] = None
    api_key_hash: Optional[str] = None

class IoTHubManager:
    def __init__(self, session: AsyncSession): # DB 세션을 주입받음
        self.session = session

    async def add_hub(self, hub_data: HubCreate) -> HubBasicInfo:
        """허브를 추가하고, 추가된 허브의 기본 정보를 반환합니다."""
        new_hub = IoTHub.model_validate(hub_data)
        self.session.add(new_hub)
        await self.session.flush()
        
        return await self.get_hub_info(new_hub.hub_id)

    async def get_hub_info(self, hub_id: int) -> Optional[HubBasicInfo]:
        """허브 ID로 허브의 기본 정보를 조회하여 _HubBasicInfo 객체로 반환합니다."""
        query = text("SELECT hub_id, unique_id, status, api_key_hash FROM iot_hubs WHERE hub_id = :hub_id")
        result = await self.session.execute(query, {"hub_id": hub_id})
        row = result.first()
        if row:
            return HubBasicInfo.model_validate(row._mapping)
        return None

    async def edit_hub_info(self, hub_id: int, update_data: HubUpdate) -> None:
        """허브 ID에 해당하는 허브의 정보를 선택적으로 수정합니다."""
        if self.get_hub_info(hub_id) is None:
            raise ValueError(f"edit_hub_info - invalid hub_id:{hub_id}")

        update_dict = update_data.model_dump(exclude_unset=True, exclude_none=True)

        if not update_dict:
            raise ValueError(f"edit_hub_info - invalid update_data:{update_data}")

        set_clause = ", ".join([f"{key} = :{key}" for key in update_dict.keys()])
        query_str = f"UPDATE iot_hubs SET {set_clause} WHERE hub_id = :hub_id"
        query = text(query_str)
        
        params = update_dict
        params['hub_id'] = hub_id

        await self.session.execute(query, params)
       
    async def get_hub_status(self, hub_id: int) -> Optional[HubStatus]:
        """허브 ID로 허브의 현재 상태를 조회하여 _HubStatus 객체로 반환합니다."""
        if self.get_hub_info(hub_id) is None:
            raise ValueError("invalid hub_id:{hub_id}")
        
        query = text("SELECT status FROM iot_hubs WHERE hub_id = :hub_id")
        result = await self.session.execute(query, {"hub_id": hub_id})
        status_str = result.scalar_one_or_none()
        if status_str:
            return HubStatus(status=status_str)
        else:
            return None

    async def set_hub_status(self, hub_id: int, status: str) -> None:
        """허브 ID에 해당하는 허브의 상태를 변경합니다."""
        if self.get_hub_info(hub_id) is None:
            raise ValueError("invalid hub_id:{hub_id}")
        
        query = text("UPDATE iot_hubs SET status = :status WHERE hub_id = :hub_id")
        await self.session.execute(query, {"hub_id": hub_id, "status": status})
