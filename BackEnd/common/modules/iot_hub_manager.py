from typing import Optional


from sqlmodel import text
from sqlalchemy.ext.asyncio import AsyncSession

from common.models.iot_models import IoTHub
from common.schemas.hub_schema import *


class IotHubManager:
    # HubBasicInfo 모델의 필드를 기반으로 SELECT할 컬럼 목록을 동적으로 생성
    _HUB_BASIC_INFO_COLUMNS = ", ".join(HubBasicInfo.model_fields.keys())

    def __init__(self, session: AsyncSession):  # DB 세션을 주입받음
        self.session = session

    async def add_hub(self, hub_data: HubCreate) -> HubBasicInfo:
        """허브를 추가하고, 추가된 허브의 기본 정보를 반환합니다."""
        new_hub = IoTHub.model_validate(hub_data)
        self.session.add(new_hub)
        await self.session.flush()

        return await self.get_hub_info(new_hub.hub_id)

    async def get_hub_info(self, hub_id: int) -> Optional[HubBasicInfo]:
        """허브 ID로 허브의 기본 정보를 조회하여 _HubBasicInfo 객체로 반환합니다."""
        query_str = f"SELECT {self._HUB_BASIC_INFO_COLUMNS} FROM iot_hubs WHERE hub_id = :hub_id"
        query = text(query_str)
        result = await self.session.execute(query, {"hub_id": hub_id})
        row = result.first()
        if row:
            return HubBasicInfo.model_validate(row._mapping)
        return None

    async def get_hub_by_device_id(self, device_id: str) -> Optional[HubBasicInfo]:
        """기기 고유 ID로 허브의 기본 정보를 조회하여 HubBasicInfo 객체로 반환합니다."""
        query_str = f"SELECT {self._HUB_BASIC_INFO_COLUMNS} FROM iot_hubs WHERE device_id = :device_id"
        query = text(query_str)
        result = await self.session.execute(query, {"device_id": device_id})
        row = result.first()
        if row:
            return HubBasicInfo.model_validate(row._mapping)
        return None

    async def get_hub_by_api_key_hash(
        self, api_key_hash: str
    ) -> Optional[HubBasicInfo]:
        """API 키 해시로 허브의 기본 정보를 조회하여 HubBasicInfo 객체로 반환합니다."""
        query_str = f"SELECT {self._HUB_BASIC_INFO_COLUMNS} FROM iot_hubs WHERE api_key_hash = :api_key_hash"
        query = text(query_str)
        result = await self.session.execute(query, {"api_key_hash": api_key_hash})
        row = result.first()
        if row:
            return HubBasicInfo.model_validate(row._mapping)
        return None

    async def get_hub_by_senior_id(self, senior_id: int) -> Optional[HubBasicInfo]:
        """API 키 해시로 허브의 기본 정보를 조회하여 HubBasicInfo 객체로 반환합니다."""
        query_str = f"SELECT {self._HUB_BASIC_INFO_COLUMNS} FROM iot_hubs WHERE senior_id = :senior_id"
        query = text(query_str)
        result = await self.session.execute(query, {"senior_id": senior_id})
        row = result.first()
        if row:
            return HubBasicInfo.model_validate(row._mapping)
        return None

    async def edit_hub_info(self, hub_id: int, update_data: HubUpdate) -> None:
        """허브 ID에 해당하는 허브의 정보를 선택적으로 수정합니다."""
        update_dict = update_data.model_dump(exclude_unset=True, exclude_none=True)

        if not update_dict:
            raise ValueError(f"edit_hub_info - invalid update_data:{update_data}")

        set_clause = ", ".join([f"{key} = :{key}" for key in update_dict.keys()])
        query_str = f"UPDATE iot_hubs SET {set_clause} WHERE hub_id = :hub_id"
        query = text(query_str)

        params = update_dict
        params["hub_id"] = hub_id

        result = await self.session.execute(query, params)

        if result.rowcount == 0:
            raise ValueError(f"edit_hub_info - Hub with hub_id:{hub_id} not found or no changes made.")

    async def get_hub_status(self, hub_id: int) -> Optional[HubStatus]:
        """허브 ID로 허브의 현재 상태를 조회하여 _HubStatus 객체로 반환합니다."""
        query = text("SELECT status FROM iot_hubs WHERE hub_id = :hub_id")
        result = await self.session.execute(query, {"hub_id": hub_id})
        status_str = result.scalar_one_or_none()
        
        if status_str is None:
            raise ValueError(f"get_hub_status - Hub with hub_id:{hub_id} not found.")

        return HubStatus(status=status_str)

    async def set_hub_status(self, hub_id: int, status: str) -> None:
        """허브 ID에 해당하는 허브의 상태를 변경합니다."""

        query = text("UPDATE iot_hubs SET status = :status WHERE hub_id = :hub_id")
        result = await self.session.execute(query, {"hub_id": hub_id, "status": status})

        if result.rowcount == 0:
            raise ValueError("set_hub_status- invalid hub_id:{hub_id}")
