# main.py

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

app = FastAPI()
connected_peers: list[WebSocket] = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_peers.append(websocket)
    print(f"클라이언트 접속: 총 {len(connected_peers)} 명")

    # ▼▼▼ 변경된 부분 ▼▼▼
    # 2명이 접속했다면, 첫 번째 클라이언트(송출자)에게 시작 신호를 보냄
    if len(connected_peers) == 2:
        # 첫 번째 클라이언트에게만 메시지를 보냅니다.
        await connected_peers[0].send_json({"type": "start"})
        print("송출자에게 방송 시작 신호를 보냈습니다.")
    # ▲▲▲ 변경 완료 ▲▲▲

    try:
        while True:
            data = await websocket.receive_json()
            for peer in connected_peers:
                if peer != websocket:
                    await peer.send_json(data)
    except WebSocketDisconnect:
        connected_peers.remove(websocket)
        print(f"클라이언트 접속 끊김: 총 {len(connected_peers)} 명")
        # 한 명이 나가면 리스트를 초기화 (간단한 1:1 예제를 위해)
        if len(connected_peers) < 2:
            connected_peers.clear()

# HTML 제공 부분은 그대로 유지
@app.get("/broadcaster", response_class=HTMLResponse)
async def get_broadcaster():
    with open("broadcaster.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/viewer", response_class=HTMLResponse)
async def get_viewer():
    with open("viewer.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())