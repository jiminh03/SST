# app/routers/monitoring.py
"""사용자 관리 및 모니터링 관련 라우터"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db import get_session
# from app.services import monitoring_service
# from app.schemas import senior_care as schemas

router = APIRouter(prefix="/seniors", tags=["사용자 관리 및 모니터링"])


@router.get(
    "",
    response_model=List[schemas.Senior],
    status_code=status.HTTP_200_OK,
    summary="사용자 리스트 조회"
)
async def get_senior_list(db: AsyncSession = Depends(get_session)):
    """관리자가 담당하는 모든 어르신의 목록과 현재 위험도 상태를 조회합니다."""
    # TODO: monitoring_service.get_all_seniors(db) 호출
    # 예시 데이터
    example_seniors = [
        schemas.Senior(senior_id=1, name="김할머님", address="서울시", health_info="양호")
    ]
    return example_seniors


@router.get(
    "/{senior_id}",
    response_model=schemas.Senior,
    status_code=status.HTTP_200_OK,
    summary="사용자 세부 정보 조회"
)
async def get_senior_details(senior_id: int, db: AsyncSession = Depends(get_session)):
    """특정 어르신 한 명의 상세 정보를 조회합니다."""
    # TODO: monitoring_service.get_senior_by_id(db, senior_id) 호출
    return schemas.Senior(senior_id=senior_id, name="김할머님", address="서울시", health_info="양호")


@router.get(
    "/{senior_id}/emergency-logs",
    response_model=List[schemas.EmergencyLog],
    status_code=status.HTTP_200_OK,
    summary="사용자 응급 상황 로그 조회"
)
async def get_emergency_logs(senior_id: int, db: AsyncSession = Depends(get_session)):
    """특정 어르신의 과거 응급 상황 이력을 조회합니다."""
    # TODO: monitoring_service.get_emergency_logs_for_senior(db, senior_id) 호출
    return []


@router.get(
    "/{senior_id}/sensor-logs",
    response_model=List[schemas.SensorLog],
    status_code=status.HTTP_200_OK,
    summary="센서 로그 타임라인 조회"
)
async def get_sensor_logs(senior_id: int, db: AsyncSession = Depends(get_session)):
    """특정 어르신의 집에서 발생한 센서 이벤트들을 기간별로 조회합니다."""
    # TODO: monitoring_service.get_sensor_logs_for_senior(db, senior_id) 호출
    return []


@router.post(
    "/schedules/visits",
    status_code=status.HTTP_201_CREATED,
    summary="직원 방문 스케줄 등록",
    tags=["사용자 관리 및 모니터링"]
)
async def create_visit_schedule(payload: schemas.VisitSchedule, db: AsyncSession = Depends(get_session)):
    """특정 어르신에 대한 직원의 방문 일정을 등록합니다."""
    # TODO: monitoring_service.create_visit(db, payload)
    return {"message": "등록 성공"}


@router.delete(
    "/schedules/visits/{visit_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="직원 방문 스케줄 삭제",
    tags=["사용자 관리 및 모니터링"]
)
async def delete_visit_schedule(visit_id: int, db: AsyncSession = Depends(get_session)):
    """등록되어 있던 방문 일정을 삭제합니다."""
    # TODO: monitoring_service.delete_visit(db, visit_id)
    return