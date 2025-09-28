import asyncio
from datetime import datetime, timezone
import os
from typing import Any, Dict

import httpx
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import redis.asyncio as redis
import uvicorn
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from common.models.enums import SensorTypeEnum
from common.modules.user_manager import UserManager
from web.routers import ai
from web.schemas.monitoring_schema import FrontendSensorStatusPayload
from web.services.senior_status_manager import SensorStatusManager

# .env 파일 로드
load_dotenv()

import socketio

from web.routers import auth, iot, monitoring, test
from web.services.database import db, red
from web.services.websocket import sio

import web.event.connection_event
import web.event.webrtc_event
import web.event.noti_event

def transform_payload_to_flat_format(payload: FrontendSensorStatusPayload) -> Dict[str, Any]:
    """
    FrontendSensorStatusPayload를 AI 서버 명세서에 맞는 형식으로 변환합니다.
    """
    # 'data' 필드는 센서 ID와 값(0 또는 1)만 포함합니다.
    sensor_data_dict = {
        member.value: 0 for member in SensorTypeEnum
    }
    if 'power_tv' in sensor_data_dict:
        sensor_data_dict['tv'] = sensor_data_dict.pop('power_tv')
    for sensor in payload.sensors:
        key = 'tv' if sensor.sensor_id == 'power_tv' else sensor.sensor_id
        if key in sensor_data_dict:
            sensor_data_dict[key] = int(sensor.value)

    # 가장 최근의 timestamp를 찾습니다.
    latest_timestamp = datetime.now(timezone.utc)
        
    # ❗ 명세서에 맞게 timestamp를 최상위 레벨로 배치합니다.
    result = {
        "senior_id": payload.senior_id,
        "timestamp": latest_timestamp.isoformat().replace("+00:00", "Z"),
        "data": sensor_data_dict
    }
    
    return result


# --- 👇 백그라운드 작업 함수 (수정됨) ---

AI_SERV = os.getenv("AI_HOST")

async def my_periodic_task():
    """10초마다 모든 어르신의 센서 상태를 AI 서버에 보내는 주기적인 작업입니다."""
    sens_man = SensorStatusManager(red)
    print("🚀 Background task started. Will run every 10 seconds.")
    
    while True:
        try:
            print("\n--- Running periodic task cycle ---")
            
            # ❗ 올바른 DB 세션 관리 방식으로 수정
            async for session in db.get_session():
                user_manager = UserManager(session)
                seni_list = await user_manager.get_all_seniors()
                if not seni_list:
                    print("No seniors found to process.")
                    await asyncio.sleep(10)
                    continue

                sen_id_list = [senior.senior_id for senior in seni_list]

            # HTTP 클라이언트는 루프마다 새로 생성하는 것이 안전합니다.
            async with httpx.AsyncClient() as client:
                for sen_id in sen_id_list:
                    print(f"Processing senior_id: {sen_id}")
                    sen_stat = await sens_man.get_all_sensor_statuses(sen_id)
                    
                    # ❗ (가장 중요) sen_stat이 None이 아닌지 확인
                    if sen_stat:
                        transformed_data  = transform_payload_to_flat_format(sen_stat)
                        
                        print(f"Sending data to AI server for senior_id {sen_id}...")
                        print(transformed_data)
                        response = await client.post(f"{AI_SERV}/ai/tick", json=transformed_data)
                        
                        print(f"AI server response for senior_id {sen_id}: {response.status_code} - {response.text}")
                    else:
                        print(f"No sensor status found in Redis for senior_id: {sen_id}. Skipping.")

        except Exception as e:
            # ❗ 루프 전체에 예외 처리를 추가하여 작업이 중단되지 않도록 함
            print(f"🔥🔥🔥 An error occurred in periodic task: {e}")
            # 오류 발생 시에도 다음 주기를 위해 대기
        
        await asyncio.sleep(10)


# Lifespan 컨텍스트 매니저 정의
@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작과 종료 시 처리할 로직"""
    print("--- FastAPI app startup: creating DB tables... ---")
    await db.create_db_and_tables()
    await db.convert_to_hypertable("sensor_logs", "timestamp")
    print("--- DB tables created successfully. ---")

    task = asyncio.create_task(my_periodic_task())
    print("--- BG task created successfully. ---")
    # 연결 확인
    try:
        await red.ping()
        print("Redis connect successfully")
    except redis.exceptions.ConnectionError as e:
        print(f"Redis connect fail: {e}")
        exit()
    yield
    task.cancel()
    print("--- FastAPI app shutdown. ---")

# FastAPI 앱 인스턴스 생성
app = FastAPI(lifespan=lifespan)

# --- 라우터 등록 ---

app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(iot.router)
app.include_router(monitoring.router)

app.include_router(test.router)

# 기본 루트 엔드포인트
app.mount("/", StaticFiles(directory="dist", html=True), name="static")


# Socket.IO 앱을 FastAPI 앱에 마운트
# 이 한 줄이 '/socket.io' 경로로 들어오는
# HTTP 핸드셰이크와 WebSocket 연결을 모두 처리합니다.
socket_app = socketio.ASGIApp(sio, app) # 실행시 진입점


# CORS 미들웨어 설정
# origins = [
#     "http://localhost",
#     "http://localhost:8080",
#     "http://i13a106.p.ssafy.io:8080",
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # 실제 운영 환경에서는 origins 변수 사용 권장
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# 이 파일을 직접 실행할 때를 위한 코드
if __name__ == "__main__":
    uvicorn.run("web.main:socket_app", host="0.0.0.0", port=int(os.getenv("MAIN_SERV_PORT")), reload=True)
