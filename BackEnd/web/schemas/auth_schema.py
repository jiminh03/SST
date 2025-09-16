from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    login_id: str
    password: str

class LoginResponse(BaseModel):
    access_token: str

class StaffRegister(BaseModel):
    full_name: str
    email: str
    login_id: str
    password: str

class StaffEdit(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class SeniorRegister(BaseModel):
    name: str
    address: str
    device_id: str

class SeniorEdit(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None

class Hub(BaseModel):
    device_id: str

class ApiKey(BaseModel):
    api_key: str
