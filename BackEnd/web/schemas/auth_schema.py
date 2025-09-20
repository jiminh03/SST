from datetime import date
from pydantic import BaseModel
from typing import Optional

from common.modules.user_manager import SeniorCreate, SeniorUpdate

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str

class StaffRegister(BaseModel):
    full_name: str
    email: str
    password: str

class StaffEdit(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None

class SeniorRegister(SeniorCreate):
    pass

class SeniorEdit(SeniorUpdate):
    full_name: str 
    address: str 
    birth_date: date 

class Hub(BaseModel):
    device_id: str

class ApiKey(BaseModel):
    api_key: str
