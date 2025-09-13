import pytest
from sqlalchemy.ext.asyncio import AsyncSession

# UserManager와 관련 모델들을 import합니다.
from common.modules.user_manager import UserManager, StaffCreate, SeniorCreate


@pytest.mark.asyncio
async def test_create_and_get_staff(get_session: AsyncSession):
    """
    새로운 직원을 생성하고, ID와 로그인 ID로 조회하는 기능을 테스트합니다.
    """
    # Arrange (준비)
    db_session = get_session
    user_manager = UserManager(db_session)
    
    staff_data = StaffCreate(
        login_id="test_staff",
        password_hash="hashed_password",
        full_name="Test Staff",
        role="admin"
    )

    # Act (실행) - 직원 생성
    new_staff = await user_manager.create_staff(staff_data)
    await db_session.flush() # ID 할당을 위해 flush

    # Assert (검증) - 생성된 직원 정보 확인
    assert new_staff.staff_id is not None
    assert new_staff.login_id == "test_staff"
    assert new_staff.full_name == "Test Staff"

    # Act (실행) - ID로 직원 조회
    retrieved_staff_by_id = await user_manager.get_staff_by_id(new_staff.staff_id)

    # Assert (검증) - ID로 조회한 정보 확인
    assert retrieved_staff_by_id is not None
    assert retrieved_staff_by_id.login_id == "test_staff"

    # Act (실행) - 로그인 ID로 직원 조회
    retrieved_staff_by_login_id = await user_manager.get_staff_by_login_id("test_staff")

    # Assert (검증) - 로그인 ID로 조회한 정보 확인
    assert retrieved_staff_by_login_id is not None
    assert retrieved_staff_by_login_id.login_id == "test_staff"


@pytest.mark.asyncio
async def test_create_and_get_senior(get_session: AsyncSession):
    """
    새로운 어르신을 생성하고, ID로 조회하는 기능을 테스트합니다.
    """
    # Arrange (준비)
    db_session = get_session
    user_manager = UserManager(db_session)
    
    senior_data = SeniorCreate(
        full_name="Test Senior",
        address="123 Test St"
    )

    # Act (실행) - 어르신 생성
    new_senior_info = await user_manager.create_senior(senior_data)

    # Assert (검증) - 생성된 어르신 정보 확인
    assert new_senior_info.senior_id is not None
    assert new_senior_info.full_name == "Test Senior"
    assert new_senior_info.address == "123 Test St"

    # Act (실행) - ID로 어르신 조회
    retrieved_senior = await user_manager.get_senior_info_by_id(new_senior_info.senior_id)

    # Assert (검증) - ID로 조회한 정보 확인
    assert retrieved_senior is not None
    assert retrieved_senior.full_name == "Test Senior"


@pytest.mark.asyncio
async def test_get_all_seniors(get_session: AsyncSession):
    """
    여러 어르신을 생성하고, 전체 목록을 조회하는 기능을 테스트합니다.
    """
    # Arrange (준비)
    db_session = get_session
    user_manager = UserManager(db_session)
    
    await user_manager.create_senior(SeniorCreate(full_name="Senior 1", address="Addr 1"))
    await user_manager.create_senior(SeniorCreate(full_name="Senior 2", address="Addr 2"))

    # Act (실행)
    all_seniors = await user_manager.get_all_seniors()

    # Assert (검증)
    assert len(all_seniors) == 2
    assert all_seniors[0].full_name == "Senior 1"
    assert all_seniors[1].full_name == "Senior 2"
