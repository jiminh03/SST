import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from common.modules.user_manager import UserManager, StaffCreate, StaffUpdate, SeniorCreate, SeniorUpdate

@pytest.mark.asyncio
async def test_create_and_edit_staff(get_session: AsyncSession):
    """Test editing a staff member's information."""
    user_manager = UserManager(get_session)

    # 1. Create a new staff member
    staff_to_create = StaffCreate(
        email="original_email",
        password_hash="hashed_password",
        full_name="original_name",
    )
    created_staff = await user_manager.create_staff(staff_to_create)
    
    assert created_staff is not None
    assert created_staff.email == "original_email"
    assert created_staff.full_name == "original_name" 

    # 2. Edit the staff member's full name
    staff_update_data = StaffUpdate(full_name="edit_name")
    await user_manager.edit_staff(staff_id=created_staff.staff_id, staff_info=staff_update_data)

    # 3. Retrieve the staff member and verify the change
    updated_staff = await user_manager.get_staff_by_id(created_staff.staff_id)

    assert updated_staff is not None
    assert updated_staff.email == "original_email"
    assert updated_staff.full_name == "edit_name"

@pytest.mark.asyncio
async def test_create_and_edit_senior(get_session: AsyncSession):
    """Test editing a senior's information."""
    user_manager = UserManager(get_session)

    # 1. Create a new senior
    senior_to_create = SeniorCreate(
        full_name="Test Senior Edit",
        address="Original Address",
        birth_date=date(1940, 1, 1),
        guardian_contact="010-1234-5678",
        profile_img=b"fake_image_bytes",
        health_info="aspirin"
    )
    created_senior = await user_manager.create_senior(senior_to_create)

    assert created_senior is not None
    assert created_senior.address == "Original Address"
    assert created_senior.full_name == "Test Senior Edit"
    assert created_senior.birth_date == date(1940, 1, 1)
    assert created_senior.guardian_contact == "010-1234-5678"
    assert created_senior.health_info == "aspirin"

    # 2. Edit the senior's address and health_info
    senior_update_data = SeniorUpdate(address="Updated Address", health_info="aspirin, plavix")
    await user_manager.edit_senior(senior_id=created_senior.senior_id, senior_info=senior_update_data)

    # 3. Retrieve the senior and verify the change
    updated_senior = await user_manager.get_senior_info_by_id(created_senior.senior_id)

    assert updated_senior is not None
    assert updated_senior.address == "Updated Address"
    assert updated_senior.full_name == "Test Senior Edit" # Should not change
    assert updated_senior.health_info == "aspirin, plavix"

@pytest.mark.asyncio
async def test_link_staff_to_senior(get_session: AsyncSession):
    """Test linking a staff member to a senior."""
    user_manager = UserManager(get_session)

    # 1. Create a new staff member
    staff_to_create = StaffCreate(
        email="link_test@example.com",
        password_hash="hashed_password",
        full_name="Link Test Staff",
    )
    created_staff = await user_manager.create_staff(staff_to_create)

    # 2. Create a new senior
    senior_to_create = SeniorCreate(
        full_name="Link Test Senior",
        address="123 Link Test St",
        birth_date=date(1950, 5, 5),
        guardian_contact="010-5555-4444",
    )
    created_senior = await user_manager.create_senior(senior_to_create)

    # 3. Link the staff to the senior
    await user_manager.link_staff_to_senior(created_staff.staff_id, created_senior.senior_id)

    # 4. Verify the link
    cared_seniors = await user_manager.get_care_seniors(created_staff.staff_id)
    assert cared_seniors is not None
    assert len(cared_seniors) == 1
    assert cared_seniors[0].senior_id == created_senior.senior_id
