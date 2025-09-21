# app/routers/iot.py
"""IoT 기기 연동 관련 라우터"""

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

# 프로젝트 구조에 맞게 경로를 수정해주세요.
from web.schemas.iot_schema import SensorLogPayload
from common.modules.sensor_log_manager import SensorLogManager
from common.modules.iot_hub_manager import IotHubManager, HubCreate, HubUpdate, HubBasicInfo
from common.modules.api_key_manager import ApiKeyRepository, ApiKeyManager
from web.services.database import db

router = APIRouter(prefix="/iot", tags=["IoT"])


@router.post(
    "/logs",
    status_code=status.HTTP_201_CREATED,
    summary="센서 이벤트 로그 전송",
    responses={
        401: {"description": "인증 실패 (유효하지 않은 API 키)"},
    }
)
async def receive_sensor_logs(
    payload: SensorLogPayload,
    db_session: AsyncSession = Depends(db.get_session)
):
    """
    홈 허브가 수집한 센서 데이터들을 묶어 서버로 전송하고 데이터베이스에 저장합니다..
    """
    # [권한 검증] API 키에 연결된 어르신 ID와 페이로드의 어르신 ID가 일치하는지 확인합니다.
    # 이를 통해 허브가 다른 어르신의 로그를 잘못 전송하는 것을 방지합니다.
    api_key_repo = ApiKeyRepository(db_session)
    hub = await api_key_repo.get_hub_by_api_key(payload.api_key)
    if hub is None:
        raise HTTPException(status_code=401, detail="Invalid API key")

    senior_id = hub.senior_id

    # SensorLogManager를 사용하여 로그를 데이터베이스에 추가합니다.
    log_manager = SensorLogManager(db_session)
    await log_manager.add_logs(senior_id, payload.sensor_data)

    await db_session.commit()
    
    return {"message": "Logs have been successfully saved."}