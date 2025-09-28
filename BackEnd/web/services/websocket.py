import socketio

# Socket.IO 서버 인스턴스를 여기서 생성합니다.
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')