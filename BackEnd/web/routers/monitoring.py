import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from common.modules.user_manager import UserManager
from web.services.database import db
from web.services.auth_service import auth_module

from web.schemas.monitoring_schema import (
    SeniorSimpleInfo,
    SeniorDetail
)
from web.services.auth_service import WebAuthModule
from web.services.img_parser import get_image_mimetype

from common.modules.user_manager import UserManager, StaffCreate, SeniorCreate, StaffInfo, StaffUpdate, SeniorUpdate
from common.modules.iot_hub_manager import IotHubManager, HubCreate, HubUpdate
from common.modules.api_key_manager import ApiKeyManager, ApiKeyRepository


router = APIRouter(prefix="/seniors", tags=["사용자 관리 및 모니터링"])


@router.get(
    "",
    response_model=List[SeniorSimpleInfo],
    status_code=status.HTTP_200_OK,
    summary="사용자 리스트 조회",
)
async def get_senior_list(
    db: AsyncSession = Depends(db.get_session),
    current_user: StaffInfo = Depends(auth_module.get_current_user)
):
    """관리자가 담당하는 모든 어르신의 목록과 현재 위험도 상태를 조회합니다."""
    user_manager = UserManager(db)
    senior_list = await user_manager.get_care_seniors(current_user.staff_id)
    managed_senior = [SeniorSimpleInfo.model_validate(senior) for senior in senior_list]
    
    return managed_senior


@router.get(
    "/{senior_id}",
    response_model=SeniorDetail,
    status_code=status.HTTP_200_OK,
    summary="사용자 세부 정보 조회"
)
async def get_senior_details(
    senior_id: int, db: AsyncSession = Depends(db.get_session),
    current_user: StaffInfo = Depends(auth_module.get_current_user)
):
    """특정 어르신 한 명의 상세 정보를 조회합니다."""
    user_manager = UserManager(db)
    senior_list = await user_manager.get_care_seniors(current_user.staff_id)

    managed_senior_ids = [senior.senior_id for senior in senior_list]

    if senior_id not in managed_senior_ids:
        raise HTTPException(
            status_code=403,
            detail="해당 어르신 정보에 접근하거나 수정할 권한이 없습니다."
        )

    senior_info = await user_manager.get_senior_info_by_id(senior_id)

    data_dict = senior_info.model_dump()

    # 2. 딕셔너리의 'profile_img' 필드를 원하는 URL 문자열로 덮어씁니다.
    #    기존 profile_img 필드는 바이트 데이터이므로, 그 존재 여부를 확인합니다.
    if senior_info.profile_img:
        data_dict['profile_img'] = f"https://j13a503.p.ssafy.io/api/seniors/{senior_info.senior_id}/profile-image"
    else:
        data_dict['profile_img'] = None

    senior_detail = SeniorDetail.model_validate(data_dict)
    
    return senior_detail


# @router.get(
#     "/{senior_id}/emergency-logs",
#     response_model=List[schemas.EmergencyLog],
#     status_code=status.HTTP_200_OK,
#     summary="사용자 응급 상황 로그 조회"
# )
# async def get_emergency_logs(senior_id: int, db: AsyncSession = Depends(get_session)):
#     """특정 어르신의 과거 응급 상황 이력을 조회합니다."""
#     # TODO: monitoring_service.get_emergency_logs_for_senior(db, senior_id) 호출
#     return []


# @router.get(
#     "/{senior_id}/sensor-logs",
#     response_model=List[schemas.SensorLog],
#     status_code=status.HTTP_200_OK,
#     summary="센서 로그 타임라인 조회"
# )
# async def get_sensor_logs(senior_id: int, db: AsyncSession = Depends(get_session)):
#     """특정 어르신의 집에서 발생한 센서 이벤트들을 기간별로 조회합니다."""
#     # TODO: monitoring_service.get_sensor_logs_for_senior(db, senior_id) 호출
#     return []


@router.get(
    "/{senior_id}/profile-image",
    responses={
        200: {
            # 다양한 이미지 타입을 반환할 수 있음을 명시
            "content": {
                "image/png": {},
                "image/jpeg": {},
                "image/gif": {},
            }
        },
        404: {"description": "Image not found"},
    }
)
async def get_senior_profile_image(
    senior_id: int,
    db: AsyncSession = Depends(db.get_session),
    current_user: StaffInfo = Depends(auth_module.get_current_user),
):
    user_manager = UserManager(db)
    senior_list = await user_manager.get_care_seniors(current_user.staff_id)
    managed_senior_ids = {senior.senior_id for senior in senior_list}

    if senior_id not in managed_senior_ids:
        raise HTTPException(
            status_code=403,
            detail="해당 어르신 정보에 접근할 권한이 없습니다."
        )
    
    senior = await user_manager.get_senior_info_by_id(senior_id)

    # 1. DB에 이미지 데이터가 있는지 확인
    if not senior or not senior.profile_img:
        raise HTTPException(
            status_code=404,
            detail="프로필 이미지를 찾을 수 없습니다."
        )

    # 2. 파싱 함수를 호출하여 이미지 데이터의 실제 MIME 타입 감지
    #    senior.profile_img[:16] -> 전체 데이터를 넘길 필요 없이 앞부분만 넘겨 효율적
    detected_mimetype = get_image_mimetype(senior.profile_img[:16])

    # 3. 감지된 MIME 타입을 media_type으로 설정.
    #    만약 알 수 없는 형식이면, 브라우저가 다운로드하도록 범용 타입을 지정 (안전장치)
    media_type = detected_mimetype or "application/octet-stream"
    
    return Response(
        content=senior.profile_img,
        media_type=media_type
    )
