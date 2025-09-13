import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import text

from common.modules.iot_hub_manager import (
    IoTHubManager,
    HubCreate,
    HubUpdate,
    HubBasicInfo
)

from common.modules.user_manager import (
    UserManager,
    StaffCreate,
    SeniorCreate,
    StaffInfo,
    SeniorInfo
)

from common.modules.sensor_log_manager import (
    SensorLogManager,
    SensorLogInfo,
    SensorLogList
)

@pytest.fixture(scope="function")
async def registered_hub_and_senior(get_session: AsyncSession):
    iot_hub_manager = IoTHubManager(get_session)
    user_manager = UserManager(get_session)
    
    hub1_info = await iot_hub_manager.add_hub(HubCreate(unique_id="device1"))
    senior_info = await user_manager.create_senior(SeniorCreate(full_name="Test Senior", address="123 Test St"))

    iot_hub_manager.edit_hub_info(hub1_info.hub_id, HubUpdate(senior_id=senior_info.senior_id))
    return hub1_info, senior_info

@pytest.mark.asyncio
async def test_add_sensor_log(get_session: AsyncSession, registered_hub: HubBasicInfo):
    """센서 로그를 추가하는 기능 테스트"""
    # Arrange
    sensor_log_manager = SensorLogManager(get_session)
    hub_id = registered_hub.hub_id
    
    #Act

    #Assert



@pytest.mark.asyncio
async def test_get_sensor_log(get_session: AsyncSession):
    pass