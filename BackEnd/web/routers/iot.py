# app/routers/iot.py
"""IoT 기기 연동 관련 라우터"""

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

# 프로젝트 구조에 맞게 경로를 수정해주세요.
from web.schemas.iot_schema import SeniorIdRequest, SeniorIdResponse, SensorLogPayload
from common.modules.sensor_log_manager import SensorLogManager
from common.modules.iot_hub_manager import IotHubManager, HubCreate, HubUpdate, HubBasicInfo
from common.modules.api_key_manager import ApiKeyRepository, ApiKeyManager
from web.services.data_alarm import notify_sensor_status_log_change
from web.services.database import db,red
from web.services.hub_service import SensorDataService
from web.services.senior_status_manager import SensorStatusManager

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

    packet = await SensorDataService(db_session).transform_sensor_data(payload)
    await SensorStatusManager(red).update_all_sensor_statuses(packet)
    print("캐싱 완료")
    await notify_sensor_status_log_change(packet)
    print("센서 이벤트 트리거 완료")

    await db_session.commit()
    
    return {"message": "Logs have been successfully saved."}


@router.get(
    "/senior_id",
    response_model=SeniorIdResponse,
    status_code=status.HTTP_200_OK,
    summary="어르신 ID 조회",
    responses={
        401: {"description": "인증 실패 (유효하지 않은 API 키)"},
        404: {"description": "해당 허브에 할당된 어르신을 찾을 수 없음"},
    }
)
async def get_senior_id_by_api_key(
    # GET 요청이므로 Query Parameter로 api_key를 받습니다.
    # Query(...)를 사용하면 필수 값으로 지정되며, Swagger UI에도 명확하게 표시됩니다.
    req: SeniorIdRequest,
    db_session: AsyncSession = Depends(db.get_session)
):
    """
    허브의 API 키를 사용하여 담당하고 있는 어르신의 고유 ID를 조회합니다.

    **[주요 로직]**
    1. 쿼리 파라미터로 받은 `api_key`가 유효한지 데이터베이스에서 확인합니다.
    2. API 키가 유효하지 않으면 `401 Unauthorized` 오류를 반환합니다.
    3. API 키가 유효하면, 해당 키에 연결된 허브(Hub) 정보를 조회합니다.
    4. 허브에 할당된 어르신 ID(`senior_id`)가 없으면 `404 Not Found` 오류를 반환합니다.
    5. 어르신 ID가 존재하면, 해당 ID를 JSON 형식으로 반환합니다.
    """
    # ApiKeyRepository를 사용하여 데이터베이스와 상호작용합니다.
    api_key_repo = ApiKeyRepository(db_session)
    hub = await api_key_repo.get_hub_by_api_key(req.api_key)
    
    # API 키가 데이터베이스에 존재하지 않거나 유효하지 않은 경우
    if hub is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid API key"
        )

    # 허브는 존재하지만, 아직 어르신과 연결되지 않은 경우
    if hub.senior_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No senior assigned to this hub"
        )
        
    # 성공적으로 조회된 경우, Pydantic 모델에 맞춰 응답을 반환합니다.
    return SeniorIdResponse(senior_id=hub.senior_id)