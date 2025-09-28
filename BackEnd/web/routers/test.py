from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

import random  # random 모듈 추가

from common.modules.api_key_manager import ApiKeyRepository
from web.schemas.iot_schema import SeniorIdRequest
from web.services.database import db, red
from common.modules.session_manager import SessionManager
from web.event.alarm_event import handle_report_emergency
from web.services.safety_alarm import request_safety_check
from web.services.senior_status_manager import SeniorStatusManager
from web.schemas.monitoring_schema import RiskLevel


router = APIRouter(prefix="/test", tags=["테스트용 라우터"])

@router.get(
    "/test_emergency",
    status_code=status.HTTP_200_OK,
)
async def test_emergency(
    req: SeniorIdRequest,
    db: AsyncSession = Depends(db.get_session),
    
):
    """특정 어르신 한 명의 상세 정보를 조회합니다."""
    sess_man = SessionManager(red)
    hub_info = await ApiKeyRepository(db).get_hub_by_api_key(req.api_key)
    con_info = await sess_man.get_session_by_hub_id(hub_info.hub_id)
    await request_safety_check(con_info.sid)
    return {"msg": "응급 상황 테스트"}

@router.get(
    "/test_status_change/{senior_id}",
    status_code=status.HTTP_200_OK,
)
async def test_emergency(
    senior_id: int,
    # req: SeniorIdRequest, # 주석 처리 또는 필요 시 사용
    db: AsyncSession = Depends(db.get_session),
):
    """특정 어르신의 상태를 랜덤으로 변경하는 테스트 API입니다."""
    # sess_man = SessionManager(red) # 이 변수는 사용되지 않으므로 주석 처리하거나 제거할 수 있습니다.
    ssm = SeniorStatusManager(red)
    
    # 1. RiskLevel 열거형의 모든 멤버를 리스트로 가져옵니다.
    all_statuses = list(RiskLevel)
    
    # 2. 리스트에서 무작위로 하나의 상태를 선택합니다.
    random_status = random.choice(all_statuses)
    
    # 3. 선택된 랜덤 상태로 업데이트합니다. (await 추가)
    await ssm.update_status(senior_id, random_status, "랜덤 상태 변경 테스트")
    
    # 어떤 상태로 변경되었는지 응답 메시지에 포함하면 더 좋습니다.
    return {"msg": f"상태 변경 테스트:{senior_id}어르신의 상태가 '{random_status.value}'(으)로 업데이트 되었습니다."}