import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from common.modules.user_manager import UserManager, StaffCreate, StaffUpdate, SeniorCreate, SeniorUpdate

@pytest.mark.asyncio
async def test_create_and_edit_staff(get_session: AsyncSession):
    """Test editing a staff member's information."""
    user_manager = UserManager(get_session)

    # 1. Create a new staff member
    staff_to_create = StaffCreate(
        login_id="test_staff_for_edit",
        password_hash="hashed_password",
        full_name="Test Staff Edit",
        role="original_role"
    )
    created_staff = await user_manager.create_staff(staff_to_create)
    
    assert created_staff is not None
    assert created_staff.role == "original_role"
    assert created_staff.full_name == "Test Staff Edit" 

    # 2. Edit the staff member's role
    staff_update_data = StaffUpdate(role="updated_role")
    await user_manager.edit_staff(staff_id=created_staff.staff_id, staff_info=staff_update_data)

    # 3. Retrieve the staff member and verify the change
    updated_staff = await user_manager.get_staff_by_id(created_staff.staff_id)

    assert updated_staff is not None
    assert updated_staff.role == "updated_role"
    assert updated_staff.full_name == "Test Staff Edit"

@pytest.mark.asyncio
async def test_create_and_edit_senior(get_session: AsyncSession):
    """Test editing a senior's information."""
    user_manager = UserManager(get_session)

    # 1. Create a new senior
    senior_to_create = SeniorCreate(
        full_name="Test Senior Edit",
        address="Original Address"
    )
    created_senior = await user_manager.create_senior(senior_to_create)

    assert created_senior is not None
    assert created_senior.address == "Original Address"
    assert created_senior.full_name == "Test Senior Edit" 

    # 2. Edit the senior's address
    senior_update_data = SeniorUpdate(address="Updated Address")
    await user_manager.edit_senior(senior_id=created_senior.senior_id, senior_info=senior_update_data)

    # 3. Retrieve the senior and verify the change
    updated_senior = await user_manager.get_senior_info_by_id(created_senior.senior_id)

    assert updated_senior is not None
    assert updated_senior.address == "Updated Address"
    assert updated_senior.full_name == "Test Senior Edit" 