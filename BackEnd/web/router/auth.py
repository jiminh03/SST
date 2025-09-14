# app/routers/auth.py
"""인증 및 등록 관련 라우터"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db import get_session
# from app.services import auth_service
# from app.schemas import senior_care as schemas

router = APIRouter(tags=["인증"])


@router.post(
    "/auth/login",
    response_model=schemas.LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="직원 로그인 기능"
)
async def login(payload: schemas.LoginRequest, db: AsyncSession = Depends(get_session)):
    """직원의 로그인 ID와 비밀번호를 받아 인증을 수행하며, 성공 시 JWT 토큰을 발급합니다."""
    # TODO: auth_service.authenticate_staff(db, payload) 호출
    # TODO: JWT 토큰 생성 및 반환
    access_token = "sample_jwt_access_token"  # 예시 토큰
    return schemas.LoginResponse(access_token=access_token)


@router.post(
    "/staffs",
    status_code=status.HTTP_201_CREATED,
    summary="직원 계정 생성"
)
async def create_staff(payload: schemas.Staff, db: AsyncSession = Depends(get_session)):
    """새로운 직원(복지사)의 계정 정보를 등록합니다."""
    # TODO: auth_service.create_staff(db, payload) 호출
    return {"message": "계정 생성 성공"}


@router.put(
    "/staffs/{staff_id}",
    status_code=status.HTTP_200_OK,
    summary="직원 계정 정보 수정"
)
async def update_staff_info(staff_id: int, payload: schemas.Staff, db: AsyncSession = Depends(get_session)):
    """특정 직원의 계정 정보를 수정합니다."""
    # TODO: auth_service.update_staff(db, staff_id, payload) 호출
    return {"message": "정보 수정 성공"}


@router.post(
    "/seniors",
    status_code=status.HTTP_201_CREATED,
    summary="어르신 등록"
)
async def register_senior(payload: schemas.Senior, db: AsyncSession = Depends(get_session)):
    """새로운 어르신의 기본 정보를 시스템에 등록합니다."""
    # TODO: auth_service.register_senior(db, payload) 호출
    return {"message": "등록 성공"}


@router.put(
    "/seniors/{senior_id}",
    status_code=status.HTTP_200_OK,
    summary="어르신 정보 수정"
)
async def update_senior_info(senior_id: int, payload: schemas.Senior, db: AsyncSession = Depends(get_session)):
    """기존에 등록된 어르신의 상세 정보를 수정합니다."""
    # TODO: auth_service.update_senior(db, senior_id, payload) 호출
    return {"message": "수정 성공"}


@router.post(
    "/hubs",
    status_code=status.HTTP_201_CREATED,
    summary="기기 등록"
)
async def register_hub(payload: schemas.Hub, db: AsyncSession = Depends(get_session)):
    """IoT 홈 허브를 시스템에 등록하고, 특정 어르신과 연결합니다."""
    # TODO: auth_service.register_hub(db, payload) 호출
    return {"message": "등록 성공"}


@router.post(
    "/hubs/{hub_id}/api-key",
    response_model=schemas.ApiKey,
    status_code=status.HTTP_200_OK,
    summary="API 키 발급"
)
async def issue_api_key(hub_id: int, db: AsyncSession = Depends(get_session)):
    """등록된 홈 허브가 서버와 안전하게 통신할 수 있도록 고유 API 키를 생성하고 발급합니다."""
    # TODO: auth_service.issue_api_key_for_hub(db, hub_id) 호출
    api_key = "generated-unique-api-key" # 예시 키
    return schemas.ApiKey(api_key=api_key)


@router.delete(
    "/hubs/{hub_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="기기 등록 해지"
)
async def unregister_hub(hub_id: int, db: AsyncSession = Depends(get_session)):
    """더 이상 사용하지 않는 홈 허브를 시스템에서 등록 해지합니다."""
    # TODO: auth_service.unregister_hub(db, hub_id) 호출
    return