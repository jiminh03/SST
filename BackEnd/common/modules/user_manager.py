from typing import Any, List, Optional
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from common.models.user_models import Staff, Senior, StaffSeniorMap

class StaffCreate(BaseModel):
    login_id: str
    password_hash: str
    full_name: str
    role: Optional[str]

class StaffInfo(BaseModel):
    login_id: str
    full_name: str
    role: Optional[str]

    class Config:
        from_attributes = True

class LoginInfo(BaseModel):
    login_id: str
    password: str


class SeniorCreate(BaseModel):
    """어르신 생성을 위한 모델"""
    full_name: str
    address: str

class SeniorInfo(BaseModel):
    """어르신 정보 응답을 위한 모델"""
    senior_id: int
    full_name: str
    address: str
    health_info: Optional[dict[str, Any]] = None

    class Config:
        from_attributes = True


class UserManager:
    """
    유저 관련 모델(Staff, Senior)의 데이터베이스 작업을 처리하는 클래스
    """

    def __init__(self, db_session: AsyncSession):
        self.session = db_session

    async def create_staff(self, staff_info:StaffCreate) -> Staff:
        """새로운 직원 정보를 생성합니다."""
        staff_data = staff_info.model_dump()
        new_staff = Staff(**staff_data)
        self.session.add(new_staff)
        await self.session.flush()
        return new_staff

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

    async def create_senior(self, senior_data: SeniorCreate) -> SeniorInfo:
        """새로운 어르신 정보를 생성하고 ID를 우선 할당받습니다."""
        new_senior = Senior(**senior_data.model_dump())
        self.session.add(new_senior)
        await self.session.flush()
        return SeniorInfo.model_validate(new_senior)

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