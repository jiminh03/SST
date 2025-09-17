from datetime import date
from typing import Any, List, Optional
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from common.models.user_models import Staff, Senior, StaffSeniorMap


class StaffCreate(BaseModel):
    login_id: str
    password_hash: str
    full_name: str
    email: Optional[str]


class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    password_hash: Optional[str] = None
    email: Optional[str] = None


class StaffInfo(BaseModel):
    staff_id: int
    login_id: str
    password_hash: str
    full_name: str
    email: Optional[str]

    class Config:
        from_attributes = True


class LoginInfo(BaseModel):
    login_id: str
    password: str


class SeniorCreate(BaseModel):
    """어르신 생성을 위한 모델"""
    profile_img: bytes
    full_name: str
    address: str
    birth_date: date
    guardian_contact: str
    health_info: Optional[List[str]] = None

class SeniorUpdate(BaseModel):
    """어르신 생성을 위한 모델"""
    profile_img: Optional[bytes] = None
    full_name: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    guardian_contact: Optional[str] = None
    health_info: Optional[List[str]] = None


class SeniorInfo(BaseModel):
    """어르신 정보 응답을 위한 모델"""
    senior_id: int
    full_name: str
    address: str
    birth_date: Optional[date] = None
    guardian_contact: Optional[str] = None
    health_info: Optional[List[str]] = None

    class Config:
        from_attributes = True


class UserManager:
    """
    유저 관련 모델(Staff, Senior)의 데이터베이스 작업을 처리하는 클래스
    """

    def __init__(self, db_session: AsyncSession):
        self.session = db_session

    async def create_staff(self, staff_info: StaffCreate) -> Staff:
        """새로운 직원 정보를 생성합니다."""
        staff_data = staff_info.model_dump()
        new_staff = Staff(**staff_data)
        self.session.add(new_staff)
        await self.session.flush()
        return new_staff

    async def edit_staff(self, staff_id: int, staff_info: StaffUpdate) -> None:
        """어르신 정보를 수정합니다."""
        if self.get_staff_by_id(staff_id) is None:
            raise ValueError(f"edit_staff - invalid staff_id:{staff_id}")

        update_dict = staff_info.model_dump(exclude_unset=True, exclude_none=True)

        if not update_dict:
            raise ValueError(f"edit_staff - invalid update_data:{staff_info}")

        set_clause = ", ".join([f"{key} = :{key}" for key in update_dict.keys()])
        query_str = f"UPDATE staffs SET {set_clause} WHERE staff_id = :staff_id"
        query = text(query_str)

        params = update_dict
        params["staff_id"] = staff_id

        await self.session.execute(query, params)

    async def get_staff_by_id(self, staff_id: int) -> Optional[Staff]:
        """
        고유 ID(PK)를 사용하여 특정 직원을 조회합니다. (Raw SQL 사용)
        """
        query = text("SELECT * FROM staffs WHERE staff_id = :staff_id")
        result = await self.session.execute(query, {"staff_id": staff_id})
        staff_info = result.mappings().first()

        if staff_info:
            return StaffInfo.model_validate(staff_info)
        else:
            return None

    async def get_staff_by_login_id(self, login_id: str) -> Optional[Staff]:
        """
        로그인 ID를 사용하여 특정 직원을 조회합니다. (Raw SQL 사용)
        """
        query = text("SELECT * FROM staffs WHERE login_id = :login_id")
        result = await self.session.execute(query, {"login_id": login_id})
        staff_info = result.mappings().first()

        if staff_info:
            return StaffInfo.model_validate(staff_info)
        else:
            return None

    async def create_senior(self, senior_data: SeniorCreate) -> SeniorInfo:
        """새로운 어르신 정보를 생성하고 ID를 우선 할당받습니다."""
        new_senior = Senior(**senior_data.model_dump())
        self.session.add(new_senior)
        await self.session.flush()
        return SeniorInfo.model_validate(new_senior)

    async def edit_senior(self, senior_id: int, senior_info: SeniorUpdate) -> None:
        """어르신 정보를 수정합니다."""
        if self.get_senior_info_by_id(senior_id) is None:
            raise ValueError(f"edit_senior - invalid senior_id:{senior_id}")

        update_dict = senior_info.model_dump(exclude_unset=True, exclude_none=True)

        if not update_dict:
            raise ValueError(f"edit_senior - invalid update_data:{senior_info}")

        set_clause = ", ".join([f"{key} = :{key}" for key in update_dict.keys()])
        query_str = f"UPDATE seniors SET {set_clause} WHERE senior_id = :senior_id"
        query = text(query_str)

        params = update_dict
        params["senior_id"] = senior_id

        await self.session.execute(query, params)

    async def get_senior_info_by_id(self, senior_id: int) -> Optional[SeniorInfo]:
        """고유 ID(PK)를 사용하여 특정 어르신 정보를 조회합니다. (Raw SQL 사용)"""
        query = text("SELECT * FROM seniors WHERE senior_id = :senior_id")
        result = await self.session.execute(query, {"senior_id": senior_id})
        senior_row = result.mappings().first()

        if senior_row:
            return SeniorInfo.model_validate(senior_row)
        return None

    async def get_all_seniors(self) -> List[SeniorInfo]:
        """데이터베이스에 등록된 모든 어르신 목록을 조회합니다. (Raw SQL 사용)"""
        query = text("SELECT * FROM seniors")
        result = await self.session.execute(query)
        senior_rows = result.mappings().all()
        return [SeniorInfo.model_validate(row) for row in senior_rows]

    async def get_care_seniors(self, staff_id: int) -> List[SeniorInfo]:
        """데이터베이스에 등록된 어르신 목록 중 담당하고 있는 어르신 목록을 조회합니다. (Raw SQL 사용)"""
        query = text(
            """
            SELECT s.*
            FROM seniors AS s
            JOIN staff_senior_map AS ssm ON s.senior_id = ssm.senior_id
            WHERE ssm.staff_id = :staff_id
            """
        )
        result = await self.session.execute(query, {"staff_id": staff_id})
        senior_rows = result.mappings().all()
        return [SeniorInfo.model_validate(row) for row in senior_rows]
