import socketio
from fastapi import FastAPI

# FastAPI 앱과 Socket.IO 서버(비동기) 생성
app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app) # 두 앱을 하나로 결합

# --- Socket.IO 이벤트 핸들러 정의 ---

# 'connect': 클라이언트가 처음 연결될 때 자동으로 발생하는 기본 이벤트
@sio.on('connect')
async def connect(sid, environ):
    # sid: 서버가 클라이언트에게 부여한 고유 ID (자동으로 전달됨)
    # environ: 연결 환경 정보 (헤더 등)
    print(f"✅ [연결 성공] 클라이언트가 접속했습니다. sid: {sid}")
    
    # 처음 접속한 클라이언트에게만 환영 메시지를 보냄 (귓속말)
    await sio.emit('response', {'message': '서버에 오신 것을 환영합니다!'}, to=sid)


# 'disconnect': 클라이언트 연결이 끊길 때 자동으로 발생하는 기본 이벤트
@sio.on('disconnect')
def disconnect(sid):
    print(f"👋 [연결 종료] 클라이언트의 연결이 끊겼습니다. sid: {sid}")


# 'chat_message': 우리가 직접 정의한 커스텀 이벤트
@sio.on('chat_message')
async def handle_chat_message(sid, data):
    # sid: 메시지를 보낸 클라이언트의 ID
    # data: 클라이언트가 보낸 데이터 (dict 또는 str)
    print(f"💬 [메시지 수신] sid: {sid}, 내용: {data['message']}")
    
    # 받은 메시지를 모든 클라이언트에게 다시 방송(emit)
    await sio.emit('chat_message', {
        'sender_sid': sid,
        'message': data['message']
    })


# --- FastAPI 엔드포인트 (HTTP API도 평소처럼 사용 가능) ---
@app.get("/api/server-status")
def get_status():
    return {"status": "ok", "connected_clients": sio.manager.get_participants('/')}