# client.py

import asyncio
import socketio

# 1. 비동기 Socket.IO 클라이언트 생성
sio = socketio.AsyncClient()

# --- 서버로부터 받을 이벤트에 대한 핸들러 정의 ---

@sio.on('connect')
async def on_connect():
    """서버 연결에 성공했을 때 자동으로 호출됩니다."""
    print("✅ 서버에 성공적으로 연결되었습니다!")
    # 연결 성공 시, 'chat_message' 이벤트를 서버로 보냅니다.
    await sio.emit('chat_message', {'message': '안녕하세요, 처음 접속했습니다!'})

@sio.on('disconnect')
async def on_disconnect():
    """서버 연결이 끊겼을 때 자동으로 호출됩니다."""
    print("👋 서버와의 연결이 끊겼습니다.")

@sio.on('response')
async def on_response(data):
    """서버가 보내는 'response' 이벤트를 받았을 때 호출됩니다."""
    print(f"📬 서버로부터 온 응답: {data['message']}")

@sio.on('chat_message')
async def on_chat_message(data):
    """서버가 방송하는 'chat_message' 이벤트를 받았을 때 호출됩니다."""
    # 내가 보낸 메시지가 아닐 경우에만 출력하여 중복을 피합니다.
    if data['sender_sid'] != sio.sid:
        print(f"💬 다른 클라이언트 메시지: {data['message']} (from: {data['sender_sid']})")


# --- 메인 로직 ---

async def main():
    """메인 실행 함수"""
    try:
        # 3. 서버에 연결을 시도합니다.
        # socketio_path는 기본적으로 '/socket.io' 입니다.
        await sio.connect('http://localhost:8000', socketio_path='/socket.io')

        # 4. 연결된 상태를 유지하며 서버로부터 오는 이벤트를 기다립니다.
        await sio.wait()

    except socketio.exceptions.ConnectionError as e:
        print(f"❌ 연결 실패: {e}")

if __name__ == '__main__':
    # 5. 비동기 메인 함수 실행
    asyncio.run(main())