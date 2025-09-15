# app/routers/iot.py
"""IoT 기기 연동 관련 라우터"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
# from app.services import iot_service
# from app.schemas import senior_care as schemas

router = APIRouter(prefix="/iot", tags=["IoT"])


@router.post(
    "/logs",
    status_code=status.HTTP_201_CREATED,
    summary="센서 이벤트 로그 전송"
)
async def receive_sensor_event_log(payload: schemas.SensorEventLog, db: AsyncSession = Depends(get_session)):
    """홈 허브가 수집한 센서 데이터들을 묶어 서버로 전송하고 데이터베이스에 저장합니다."""
    # TODO: iot_service.save_sensor_logs(db, payload) 호출
    return {"message": "로그 전송 성공"}


@router.post(
    "/seniors/{senior_id}/safety-check",
    status_code=status.HTTP_202_ACCEPTED,
    summary="어르신 안전 확인 요청",
    tags=["IoT"] # prefix가 iot이므로 태그만 추가
)
async def request_safety_check(senior_id: int, db: AsyncSession = Depends(get_session)):
    """AI나 관리자의 판단에 따라, 특정 어르신의 안전 확인을 로봇에게 명령합니다."""
    # TODO: iot_service.command_safety_check(db, senior_id) 호출 (예: WebSocket으로 허브에 명령)
    return {"message": "확인 요청 성공"}


@router.post(
    "/safety-checks/{check_id}/result",
    status_code=status.HTTP_200_OK,
    summary="안전 확인 결과 보고",
    tags=["IoT"]
)
async def report_safety_check_result(check_id: int, payload: schemas.SafetyCheckResult, db: AsyncSession = Depends(get_session)):
    """안전 확인을 수행한 로봇이 확인 결과를 서버로 보고합니다."""
    # TODO: iot_service.process_safety_check_result(db, check_id, payload) 호출
    return {"message": "결과 보고 성공"}