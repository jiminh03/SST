import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

# 활성화된 웹소켓 연결을 관리하는 딕셔너리
# key: client_id, value: WebSocket connection
active_connections: dict[str, WebSocket] = {}

# 1. HTTP API 엔드포인트: 연결 요청을 받음
@app.post("/request-connection/{client_id}")
async def request_connection(client_id: str):
    """
    HTTP 요청을 받아 특정 클라이언트에게 웹소켓으로 알림을 보냅니다.
    """
    # 현재 접속해 있는 클라이언트인지 확인
    if client_id in active_connections:
        websocket = active_connections[client_id]
        
        # 알림 메시지 생성
        notification_message = {
            "type": "notification",
            "payload": f"새로운 연결 요청이 도착했습니다. (from: 로봇)"
        }
        
        # 해당 클라이언트에게만 알림 전송
        await websocket.send_text(json.dumps(notification_message))
        print(f"Sent notification to client '{client_id}'")
        
        return {"status": "success", "message": f"Notification sent to {client_id}"}
    else:
        print(f"Client '{client_id}' not found.")
        return {"status": "error", "message": f"Client {client_id} is not connected"}

# 2. WebSocket 엔드포인트: 클라이언트의 접속을 처리
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    클라이언트가 웹소켓으로 접속하면 이를 등록하고 메시지를 기다립니다.
    """
    await websocket.accept()
    active_connections[client_id] = websocket
    print(f"Client '{client_id}' connected via WebSocket.")
    
    try:
        while True:
            # 클라이언트로부터 오는 메시지(예: ack)를 기다림
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ack":
                print(f"Received acknowledgment from '{client_id}': {message.get('status')}")

    except WebSocketDisconnect:
        # 연결이 끊어지면 등록 해제
        del active_connections[client_id]
        print(f"Client '{client_id}' disconnected.")

# 서버 실행을 위해 uvicorn을 사용합니다.
# 터미널에서 `uvicorn backend_server:app --reload` 명령어로 실행하세요.