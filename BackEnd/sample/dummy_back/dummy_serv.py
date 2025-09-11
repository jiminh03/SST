from fastapi import FastAPI, Body
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
# --- Pydantic 모델 정의 (OpenAPI schemas 기반) ---

class LoginRequest(BaseModel):
    login_id: str
    password: str

class LoginResponse(BaseModel):
    access_token: str = "dummy-jwt-access-token"

class Staff(BaseModel):
    staff_id: Optional[int] = None
    name: str
    role: str

class Senior(BaseModel):
    senior_id: Optional[int] = None
    name: str
    address: Optional[str] = None
    health_info: Optional[str] = None

class Hub(BaseModel):
    hub_id: Optional[int] = None
    mac_address: str
    senior_id: int

class ApiKey(BaseModel):
    api_key: str = "dummy-generated-api-key"

class EmergencyLog(BaseModel):
    log_id: int
    timestamp: datetime
    details: str

class SensorLog(BaseModel):
    log_id: int
    timestamp: datetime
    sensor_type: str
    value: str

class VisitSchedule(BaseModel):
    visit_id: Optional[int] = None
    senior_id: int
    staff_id: int
    visit_date: datetime

class SensorDataItem(BaseModel):
    sensor_type: Literal[
        "door_bedroom", "door_bathroom", "door_livingroom", "door_entrance", 
        "door_fridge", "pir_bedroom", "pir_livingroom", "pir_bathroom", 
        "light_bedroom", "light_livingroom", "light_bathroom", "power_tv"
    ]
    sensor_value: bool
    event_description: str
    timestamp: datetime

class SensorEventLog(BaseModel):
    api_key: str
    sensor_data: List[SensorDataItem]

class SafetyCheckResult(BaseModel):
    result: Literal["어르신 응답 확인", "응답 없음"]

class AIWeight(BaseModel):
    weight_id: Optional[int] = None
    version: str
    path: str

class RiskLevel(BaseModel):
    risk_level: Literal["안전", "주의", "위험"]

class AIErrorLog(BaseModel):
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)
    error_message: str


# --- FastAPI 앱 생성 ---

app = FastAPI(
    title="Smart Senior care system Dummy API",
    description="독거노인 스마트 홈케어 시스템의 테스트를 위한 FastAPI 더미 서버",
    version="1.0"
)

# --- CORS 미들웨어 추가 ---
# origins 변수에 허용할 출처를 추가합니다.
# 개발 중에는 모든 출처를 허용하기 위해 ["*"]를 사용하기도 합니다.
origins = [
    "*", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # cookie 등 자격 증명을 허용할지 여부
    allow_methods=["*"],    # 모든 HTTP 메소드 허용
    allow_headers=["*"],    # 모든 HTTP 헤더 허용
)
# -------------------------

# --- API 엔드포인트 구현 ---

# 인증
@app.post("/auth/login", tags=["인증"], response_model=LoginResponse)
async def login(body: LoginRequest):
    """직원 로그인 기능"""
    return LoginResponse()

@app.post("/staffs", tags=["인증"], status_code=201)
async def create_staff(staff: Staff):
    """직원 계정 생성"""
    return staff

@app.put("/staffs/{staff_id}", tags=["인증"])
async def update_staff_info(staff_id: int, staff: Staff):
    """직원 계정 정보 수정"""
    return {"staff_id": staff_id, **staff.dict()}

@app.post("/seniors", tags=["인증"], status_code=201)
async def register_senior(senior: Senior):
    """어르신 등록"""
    return senior

@app.post("/hubs", tags=["인증"], status_code=201)
async def register_hub(hub: Hub):
    """기기 등록"""
    return hub

@app.put("/seniors/{senior_id}", tags=["인증"])
async def update_senior_info(senior_id: int, senior: Senior):
    """어르신 정보 수정"""
    return {"senior_id": senior_id, **senior.dict()}

@app.post("/hubs/{hub_id}/api-key", tags=["인증"], response_model=ApiKey)
async def issue_api_key(hub_id: int):
    """API 키 발급"""
    return ApiKey()

@app.delete("/hubs/{hub_id}", tags=["인증"], status_code=204)
async def unregister_hub(hub_id: int):
    """기기 등록 해지"""
    return {"message": f"Hub {hub_id} has been unregistered."}


# 사용자 관리 및 모니터링
@app.get("/seniors", tags=["사용자 관리 및 모니터링"], response_model=List[Senior])
async def get_senior_list():
    """사용자 리스트 조회"""
    return [
        Senior(senior_id=1, name="김할머니", address="서울시 강남구", health_info="고혈압"),
        Senior(senior_id=2, name="이할아버지", address="부산시 해운대구", health_info="당뇨"),
    ]

@app.get("/seniors/{senior_id}", tags=["사용자 관리 및 모니터링"], response_model=Senior)
async def get_senior_details(senior_id: int):
    """사용자 세부 정보 조회"""
    return Senior(senior_id=senior_id, name=f"더미 어르신 {senior_id}", address="더미 주소", health_info="특이사항 없음")

@app.get("/seniors/{senior_id}/emergency-logs", tags=["사용자 관리 및 모니터링"], response_model=List[EmergencyLog])
async def get_emergency_logs(senior_id: int):
    """사용자 응급 상황 로그 조회"""
    return [
        EmergencyLog(log_id=101, timestamp=datetime.now(), details="[위험] 화장실에서 장시간 움직임 없음"),
        EmergencyLog(log_id=102, timestamp=datetime.now(), details="[주의] 활동량 급감"),
    ]

@app.get("/seniors/{senior_id}/sensor-logs", tags=["사용자 관리 및 모니터링"], response_model=List[SensorLog])
async def get_sensor_logs(senior_id: int):
    """센서 로그 타임라인 조회"""
    return [
        SensorLog(log_id=1, timestamp=datetime.now(), sensor_type="door_entrance", value="opened"),
        SensorLog(log_id=2, timestamp=datetime.now(), sensor_type="pir_livingroom", value="detected"),
    ]

@app.post("/schedules/visits", tags=["사용자 관리 및 모니터링"], status_code=201)
async def create_visit_schedule(schedule: VisitSchedule):
    """직원 방문 스케줄 등록"""
    return schedule

@app.delete("/schedules/visits/{visit_id}", tags=["사용자 관리 및 모니터링"], status_code=204)
async def delete_visit_schedule(visit_id: int):
    """직원 방문 스케줄 삭제"""
    return {"message": f"Visit schedule {visit_id} deleted."}


# IoT
@app.post("/iot/logs", tags=["IoT"], status_code=201)
async def send_sensor_event_log(log: SensorEventLog):
    """센서 이벤트 로그 전송"""
    return log

@app.post("/seniors/{senior_id}/safety-check", tags=["IoT"], status_code=202)
async def request_safety_check(senior_id: int):
    """어르신 안전 확인 요청"""
    return {"message": f"Safety check requested for senior {senior_id}."}

@app.post("/safety-checks/{check_id}/result", tags=["IoT"])
async def report_safety_check_result(check_id: int, result: SafetyCheckResult):
    """안전 확인 결과 보고"""
    return {"check_id": check_id, **result.dict()}


# AI
@app.get("/ai/weights/active", tags=["AI"], response_model=AIWeight)
async def get_active_weight_path(senior_id: int):
    """가중치 경로 조회"""
    return AIWeight(weight_id=1, version="1.0.2", path=f"/models/senior_{senior_id}/active_model.pth")

@app.post("/ai/weights", tags=["AI"], status_code=201)
async def register_new_weight(weight: AIWeight):
    """가중치 등록 신청"""
    return weight

@app.put("/ai/weights/{weight_id}/activate", tags=["AI"])
async def activate_weight(weight_id: int):
    """가중치 버전 관리 및 활성화"""
    return {"message": f"Weight {weight_id} has been activated."}

@app.put("/seniors/{senior_id}/risk-level", tags=["AI"])
async def update_risk_level(senior_id: int, risk_level: RiskLevel):
    """AI 위험도 분석 결과 업데이트"""
    return {"senior_id": senior_id, **risk_level.dict()}

@app.post("/ai/logs/errors", tags=["AI"], status_code=201)
async def collect_ai_error_log(log: AIErrorLog):
    """AI 예외/오류 로그 수집"""
    return log