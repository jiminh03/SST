# common/models/user_models.py
from datetime import datetime, timezone, date
from typing import List, Optional

from sqlalchemy import Column, LargeBinary
from sqlalchemy.dialects.postgresql import JSON, JSONB
from sqlmodel import Field, Relationship, SQLModel


class StaffSeniorMap(SQLModel, table=True):
    """직원과 어르신의 다대다 관계를 위한 연결 테이블"""
    __tablename__ = "staff_senior_map"
    
    map_id: int = Field(default=None, primary_key=True, index=True)
    staff_id: int = Field(foreign_key="staffs.staff_id", primary_key=False)
    senior_id: int = Field(foreign_key="seniors.senior_id", primary_key=False)

    # # 이 테이블을 통해 생성될 방문 일정 목록
    # visit_schedules: List["VisitSchedule"] = Relationship(back_populates="staff_senior_map")


class Staff(SQLModel, table=True):
    """복지기관 직원 정보를 저장하는 테이블"""
    __tablename__ = "staffs"

    staff_id: Optional[int] = Field(default=None, index= True, primary_key=True)
    email: str = Field(unique=True, index=True, description="로그인 이메일")
    password_hash: str = Field(description="해시된 비밀번호")
    full_name: str = Field(description="직원 이름")
    created_at: datetime = Field(
        default_factory=datetime.utcnow, nullable=False
    )

    # StaffSeniorMap을 통해 연결된 어르신 목록
    seniors: List["Senior"] = Relationship(back_populates="staffs", link_model=StaffSeniorMap)

class Senior(SQLModel, table=True):
    """어르신 정보를 저장하는 테이블"""
    __tablename__ = "seniors"

    senior_id: Optional[int] = Field(default=None, primary_key=True)

    profile_img: Optional[bytes] = Field(
        default=None, sa_column=Column(LargeBinary), description="어르신 프로필 이미지"
    )
    full_name: str = Field(description="어르신 이름")
    address: str = Field(description="주소")
    birth_date: date = Field(description="생년월일")
    guardian_contact: Optional[str] = Field(default=None, description="보호자 연락처")

    health_info: Optional[str] = Field(
        default=None,
        description="건강 정보 (복용약 리스트 등)",
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, nullable=False
    )

    # StaffSeniorMap을 통해 연결된 담당 직원 목록
    staffs: List["Staff"] = Relationship(back_populates="seniors", link_model=StaffSeniorMap)

    # Senior와 일대일 또는 일대다 관계를 맺는 다른 테이블들
    iot_hub: Optional["IoTHub"] = Relationship(back_populates="senior")
    ai_weights: List["AIWeight"] = Relationship(back_populates="senior")
    emergency_logs: List["EmergencyLog"] = Relationship(back_populates="senior")    
