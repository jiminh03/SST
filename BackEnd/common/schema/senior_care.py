# app/schemas/senior_care.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# 예시: 로그인 요청
class LoginRequest(BaseModel):
    login_id: str
    password: str

# 예시: 로그인 응답
class LoginResponse(BaseModel):
    access_token: str

# 예시: 직원 정보
class Staff(BaseModel):
    staff_id: Optional[int] = None
    name: str
    role: str

# ... 명세서의 모든 스키마를 Pydantic 모델로 변환합니다 ...