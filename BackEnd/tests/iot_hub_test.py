import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import text

# IoTHubManager와 테스트에 필요한 모델들을 import합니다.
from common.modules.iot_hub_manager import (
    IotHubManager,
    HubCreate,
    HubUpdate,
)

@pytest.mark.asyncio
async def test_add_hub(get_session: AsyncSession):
    """HubCreate 모델을 사용하여 허브를 추가하는 기능 테스트"""
    iot_hub_manager = IotHubManager(get_session)

    # 1. device_id만으로 추가
    hub1_info = await iot_hub_manager.add_hub(HubCreate(device_id="device1"))
    assert hub1_info.device_id == "device1"
    assert hub1_info.status == "offline"

    
    # 2. api 키 포함하여 추가
    hub3_info = await iot_hub_manager.add_hub(HubCreate(device_id="device3", api_key_hash="123123"))
    assert hub3_info.device_id == "device3"

    # get_hub_status가 _HubStatus 객체를 반환하는지 확인
    hub1_status = await iot_hub_manager.get_hub_status(hub_id=hub1_info.hub_id)
    assert hub1_status.status == "offline"

@pytest.mark.asyncio
async def test_edit_hub_info(get_session: AsyncSession):
    """HubUpdate 모델을 사용하여 허브 정보를 선택적으로 수정하는 기능 테스트"""
    iot_hub_manager = IotHubManager(get_session)
    
    # 테스트를 위한 초기 허브 추가
    hub_info = await iot_hub_manager.add_hub(
        HubCreate(device_id="device_to_edit", api_key_hash="initial_key")
    )
    hub_id = hub_info.hub_id

    # 1. device_id와 api_key_hash를 동시에 수정
    await iot_hub_manager.edit_hub_info(hub_id=hub_id, update_data=HubUpdate(device_id="edited_device", api_key_hash="edited_key"))
    
    # 수정된 정보 확인
    edited_hub_info = await iot_hub_manager.get_hub_info(hub_id)
    assert edited_hub_info.device_id == "edited_device"

    db_row_after_second_edit = (await get_session.execute(text("SELECT senior_id, api_key_hash FROM iot_hubs WHERE hub_id=:hub_id"), {"hub_id": hub_id})).first()
    assert db_row_after_second_edit.api_key_hash == "edited_key"

@pytest.mark.asyncio
async def test_hub_status_change(get_session: AsyncSession):
    """허브의 상태(on/offline 등)를 변경하고 조회하는 기능 테스트"""
    iot_hub_manager = IotHubManager(get_session)

    # 테스트를 위한 허브 추가
    hub_info = await iot_hub_manager.add_hub(HubCreate(device_id="status_test_device"))
    hub_id = hub_info.hub_id

    # 초기 상태 확인
    initial_status = await iot_hub_manager.get_hub_status(hub_id=hub_id)
    assert initial_status.status == "offline"

    # 상태를 'online'으로 변경
    await iot_hub_manager.set_hub_status(hub_id=hub_id, status="online")
    online_status = await iot_hub_manager.get_hub_status(hub_id=hub_id)
    assert online_status.status == "online"

    # 상태를 'error'로 변경
    await iot_hub_manager.set_hub_status(hub_id=hub_id, status="error")
    error_status = await iot_hub_manager.get_hub_status(hub_id=hub_id)
    assert error_status.status == "error"
