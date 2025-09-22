from pydantic import BaseModel
from datetime import date
from typing import Optional

class StaffCreate(BaseModel):
    email: str
    password_hash: str
    full_name: str


class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    password_hash: Optional[str] = None
    email: Optional[str] = None


class StaffInfo(BaseModel):
    staff_id: int
    email: str
    password_hash: str
    full_name: str

    class Config:
        from_attributes = True

class SeniorCreate(BaseModel):
    """어르신 생성을 위한 모델"""
    profile_img: Optional[bytes] = None
    full_name: str
    address: str
    birth_date: date
    guardian_contact: Optional[str] = None
    health_info: Optional[str] = None

class SeniorUpdate(BaseModel):
    """어르신 수정을 위한 모델"""
    profile_img: Optional[bytes] = None
    full_name: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    guardian_contact: Optional[str] = None
    health_info: Optional[str] = None


class SeniorInfo(BaseModel):
    """어르신 정보 응답을 위한 모델"""
    senior_id: int
    profile_img: Optional[bytes] = None
    full_name: str
    address: str
    device_id:str
    birth_date: date
    guardian_contact: Optional[str] = None
    health_info: Optional[str] = None

    class Config:
        from_attributes = True