from typing import List
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import text
import datetime

from common.modules.user_manager import UserManager, SeniorCreate, SeniorInfo
from common.modules.sensor_log_manager import (
    SensorLogManager,
    SensorLogInfo,
    SensorLogList,
)
from common.models.enums import SensorTypeEnum


@pytest.fixture(scope="function")
async def registered_senior(get_session: AsyncSession) -> SeniorInfo:
    """
    테스트를 위해 IoT 허브 1개와 어르신 1명을 생성하고 서로 연결합니다.
    연결이 완료된 hub_info와 senior_info 객체를 반환합니다.
    """
    user_manager = UserManager(get_session)
    senior_to_create = SeniorCreate(
        full_name="Test Senior Edit",
        address="Original Address",
        birth_date=datetime.date(1940, 1, 1),
        guardian_contact="010-1234-5678",
        profile_img=b"fake_image_bytes",
        health_info=["aspirin"]
    )

    senior_info = await user_manager.create_senior(
        senior_to_create
    )

    return senior_info


@pytest.mark.asyncio
async def test_add_multiple_sensor_logs_and_verify(
    get_session: AsyncSession, registered_senior: SeniorInfo
):
    """
    여러 개의 센서 로그를 리스트 형태로 한 번에 추가하고,
    DB에 모든 데이터가 올바르게 저장되었는지 검증합니다.
    """
    # Arrange (준비)
    db_session = get_session
    sensor_log_manager = SensorLogManager(db_session)
    senior_info = registered_senior

    now = datetime.datetime.now(datetime.timezone.utc)
    log1 = SensorLogInfo(
        timestamp=now - datetime.timedelta(seconds=10),
        sensor_type=SensorTypeEnum.DOOR_ENTRANCE,
        sensor_value=True,
        event_description="Main door opened",
    )
    log2 = SensorLogInfo(
        timestamp=now,
        sensor_type=SensorTypeEnum.DOOR_BATHROOM,
        sensor_value=False,
        event_description="Bathroom door closed",
    )
    logs_to_add: List[SensorLogInfo] = [log1, log2]

    # Act (실행)
    await sensor_log_manager.add_logs(
        senior_id=senior_info.senior_id, logs_data=logs_to_add
    )

    # Assert (검증)
    query = text(
        "SELECT * FROM sensor_logs WHERE senior_id = :senior_id ORDER BY timestamp DESC LIMIT 2"
    )
    result = await db_session.execute(query, {"senior_id": senior_info.senior_id})
    retrieved_log_rows = result.all()

    assert retrieved_log_rows is not None
    assert len(retrieved_log_rows) == 2

    validated_log_new = SensorLogInfo.model_validate(retrieved_log_rows[0])
    validated_log_old = SensorLogInfo.model_validate(retrieved_log_rows[1])

    assert validated_log_new.sensor_type == log2.sensor_type
    assert validated_log_new.sensor_value == log2.sensor_value
    assert validated_log_new.event_description == log2.event_description
    assert retrieved_log_rows[0].senior_id == senior_info.senior_id

    assert validated_log_old.sensor_type == log1.sensor_type
    assert validated_log_old.sensor_value == log1.sensor_value
    assert validated_log_old.event_description == log1.event_description
    assert retrieved_log_rows[1].senior_id == senior_info.senior_id


@pytest.mark.asyncio
async def test_get_all_logs_for_hub(
    get_session: AsyncSession, registered_senior: SeniorInfo
):
    """
    특정 허브에 연결된 어르신의 로그 목록 조회를 테스트합니다. (SensorLogList 모델 활용)
    """
    # Arrange (준비)
    db_session = get_session
    sensor_log_manager = SensorLogManager(db_session)
    senior_info = registered_senior

    now = datetime.datetime.now(datetime.timezone.utc)
    log_old = SensorLogInfo(
        timestamp=now - datetime.timedelta(minutes=5),
        sensor_type=SensorTypeEnum.DOOR_ENTRANCE,
        sensor_value=True,
        event_description="Main door was opened 5 minutes ago.",
    )
    log_new = SensorLogInfo(
        timestamp=now,
        sensor_type=SensorTypeEnum.PIR_LIVINGROOM,
        sensor_value=True,
        event_description="Motion detected in the living room.",
    )
    logs_to_add: List[SensorLogInfo] = [log_new, log_old]

    await sensor_log_manager.add_logs(senior_info.senior_id, logs_to_add)

    # Act (실행)
    log_list_result: SensorLogList = await sensor_log_manager.get_logs_by_senior_id(
        senior_info.senior_id
    )

    # Assert (검증)

    assert isinstance(log_list_result, SensorLogList)
    assert log_list_result.senior_id == senior_info.senior_id
    assert len(log_list_result.log_list) == 2

    retrieved_new_log = log_list_result.log_list[0]
    assert retrieved_new_log.sensor_type == log_new.sensor_type
    assert retrieved_new_log.sensor_value == log_new.sensor_value
    assert retrieved_new_log.event_description == log_new.event_description
    assert retrieved_new_log.timestamp == pytest.approx(
        log_new.timestamp, abs=datetime.timedelta(seconds=1)
    )

    retrieved_old_log = log_list_result.log_list[1]
    assert retrieved_old_log.sensor_type == log_old.sensor_type
    assert retrieved_old_log.sensor_value == log_old.sensor_value
    assert retrieved_old_log.event_description == log_old.event_description
    assert retrieved_old_log.timestamp == pytest.approx(
        log_old.timestamp, abs=datetime.timedelta(seconds=1)
    )
