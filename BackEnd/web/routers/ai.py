# app/routers/ai.py
"""AI 모델 및 분석 관련 라우터"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from web.services.senior_status_manager import SeniorStatusManager
from web.services.database import db, red
from web.schemas.ai_schmas import RiskAssessmentPacket


router = APIRouter(prefix="/ai", tags=["AI"])


# @router.get(
#     "/weights/active",
#     response_model=schemas.AIWeight,
#     status_code=status.HTTP_200_OK,
#     summary="활성화된 가중치 경로 조회"
# )
# async def get_active_weight(senior_id: int, db: AsyncSession = Depends(get_session)):
#     """AI 실행 서버가 특정 어르신 분석에 사용할 활성 AI 모델 가중치 파일 경로를 조회합니다."""
#     # TODO: ai_service.get_active_weight_for_senior(db, senior_id) 호출
#     return schemas.AIWeight(weight_id=1, version="1.2.0", path="/path/to/active/model.pt")


# @router.post(
#     "/weights",
#     status_code=status.HTTP_201_CREATED,
#     summary="가중치 등록 신청"
# )
# async def register_new_weight(payload: schemas.AIWeight, db: AsyncSession = Depends(get_session)):
#     """AI 학습 서버가 학습 완료한 새로운 가중치 모델 정보를 백엔드에 등록합니다."""
#     # TODO: ai_service.register_weight(db, payload) 호출
#     return {"message": "등록 신청 성공"}


# @router.put(
#     "/weights/{weight_id}/activate",
#     status_code=status.HTTP_200_OK,
#     summary="가중치 버전 활성화"
# )
# async def activate_weight(weight_id: int, db: AsyncSession = Depends(get_session)):
#     """여러 버전의 가중치 중, 실제 이상치 탐지에 사용할 특정 버전을 활성화시킵니다."""
#     # TODO: ai_service.activate_weight_version(db, weight_id) 호출
#     return {"message": "활성화 성공"}


@router.put(
    "/seniors/{senior_id}/risk-level",
    status_code=status.HTTP_200_OK,
    summary="AI 위험도 분석 결과 업데이트",
    tags=["AI"]
)
async def update_risk_level(senior_id: int, payload: RiskAssessmentPacket, db: AsyncSession = Depends(db.get_session)):
    """AI 실행 서버가 분석한 어르신의 최신 위험도 상태를 백엔드 서버에 업데이트합니다."""
    # sess_man = SessionManager(red) # 이 변수는 사용되지 않으므로 주석 처리하거나 제거할 수 있습니다.
    ssm = SeniorStatusManager(red)
    
    # 3. 선택된 랜덤 상태로 업데이트합니다. (await 추가)
    await ssm.update_status(senior_id, payload.risk_level, payload.reason)
    
    # 어떤 상태로 변경되었는지 응답 메시지에 포함하면 더 좋습니다.
    return {"msg": f"상태 변경 테스트:{senior_id}어르신의 상태가 '{payload.risk_level.value}'(으)로 업데이트 되었습니다."}

# @router.post(
#     "/logs/errors",
#     status_code=status.HTTP_201_CREATED,
#     summary="AI 예외/오류 로그 수집"
# )
# async def collect_ai_error_log(payload: schemas.AIErrorLog, db: AsyncSession = Depends(db.get_session)):
#     """AI 서버의 분석 과정에서 발생한 오류를 백엔드에 로그로 기록합니다."""
#     # TODO: ai_service.log_error(db, payload) 호출
#     return {"message": "로그 기록 성공"}