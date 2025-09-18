# app/main.py
# app 폴더의 메인 실행 파일

import os

import uvicorn
from fastapi import FastAPI
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

# .env 파일 로드
load_dotenv()

from web.routers import auth, iot
from web.services.database import db

# Lifespan 컨텍스트 매니저 정의
@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작과 종료 시 처리할 로직"""
    print("--- FastAPI app startup: creating DB tables... ---")
    await db.create_db_and_tables()
    await db.convert_to_hypertable("sensor_logs", "timestamp")
    print("--- DB tables created successfully. ---")
    yield
    print("--- FastAPI app shutdown. ---")

# FastAPI 앱 인스턴스 생성
app = FastAPI(lifespan=lifespan)


# CORS 미들웨어 설정
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://i13a106.p.ssafy.io:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 운영 환경에서는 origins 변수 사용 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 라우터 등록 --- 

app.include_router(auth.router)
#app.include_router(ai.router)
app.include_router(iot.router)
#app.include_router(monitoring.router)
#app.include_router(realtime.router)


# 기본 루트 엔드포인트
@app.get("/")
def read_root():
    return {"message": "Server is running successfully!"}

# 이 파일을 직접 실행할 때를 위한 코드
if __name__ == "__main__":
    uvicorn.run("web.main:app", host="0.0.0.0", port=int(os.getenv("MAIN_SERV_PORT")), reload=True)
