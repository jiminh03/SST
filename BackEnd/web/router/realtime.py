# app/routers/realtime.py
"""실시간 통신 (WebSocket / WebRTC) 관련 라우터"""

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
# from app.services import realtime_service
# from app.schemas import senior_care as schemas

router = APIRouter(tags=["실시간 통신 (WebSocket / WebRTC)"])


@router.post(
    "/webrtc/sessions",
    response_model=schemas.WebRTCSession,
    status_code=status.HTTP_201_CREATED,
    summary="WebRTC 영상 스트리밍 세션 등록"
)
async def create_webrtc_session(db: AsyncSession = Depends(get_session)):
    """관리자가 특정 로봇의 영상을 보기 위해 WebRTC 연결을 요청하고 세션을 생성합니다."""
    # TODO: realtime_service.create_webrtc_session(db) 호출
    return schemas.WebRTCSession(session_id="new_session_123", status="pending")


@router.get(
    "/webrtc/sessions/{session_id}",
    response_model=schemas.WebRTCSession,
    status_code=status.HTTP_200_OK,
    summary="WebRTC 영상 스트리밍 세션 조회"
)
async def get_webrtc_session(session_id: str, db: AsyncSession = Depends(get_session)):
    """생성된 WebRTC 세션의 현재 상태를 조회합니다."""
    # TODO: realtime_service.get_webrtc_session_status(db, session_id) 호출
    return schemas.WebRTCSession(session_id=session_id, status="active")


@router.websocket("/ws/notifications")
async def websocket_notifications_endpoint(websocket: WebSocket):
    """관리자(웹/앱)가 실시간 알림을 수신하기 위한 WebSocket 연결입니다."""
    await websocket.accept()
    try:
        while True:
            # TODO: 클라이언트로부터 메시지 수신 또는 서버에서 알림 푸시 로직 구현
            data = await websocket.receive_text()
            await websocket.send_text(f"Message text was: {data}")
    except WebSocketDisconnect:
        print("클라이언트 연결 해제")


@router.websocket("/ws/hub")
async def websocket_hub_endpoint(websocket: WebSocket):
    """홈허브가 상태 발신 및 이상치 감지 알림을 수신하기 위한 WebSocket 연결입니다."""
    await websocket.accept()
    try:
        while True:
            # TODO: 홈허브와 통신하며 상태 확인 및 이상치 알림 전송 로직 구현
            data = await websocket.receive_text()
            await websocket.send_text(f"Hub message was: {data}")
    except WebSocketDisconnect:
        print("홈허브 연결 해제")