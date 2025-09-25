from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from common.modules.api_key_manager import ApiKeyManager, ApiKeyRepository
from web.schemas.iot_schema import SeniorIdRequest
from web.services.database import db, red
from common.modules.session_manager import SessionManager, SessionType, ConnectionInfo
from web.services.safety_alarm import request_safety_check

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
