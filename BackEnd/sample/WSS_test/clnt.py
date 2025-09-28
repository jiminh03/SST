import asyncio
import websockets
import json

CLIENT_ID = "staff_monitor_1" # 이 클라이언트의 고유 ID

async def listen_for_notifications():
    """
    서버에 접속하여 계속해서 알림을 기다립니다.
    """
    uri = f"ws://localhost:8000/ws/{CLIENT_ID}"
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"WebSocket client '{CLIENT_ID}' connected and listening...")

            async for message in websocket:
                data = json.loads(message)
                print(f"< Received from server: {data}")

                if data.get("type") == "notification":
                    print("--> Notification received! Sending acknowledgment...")
                    
                    ack_message = {"type": "ack", "status": "confirmed"}
                    await websocket.send(json.dumps(ack_message))
                    print(f"> Sent acknowledgment back to server.")
    
    except ConnectionRefusedError:
        print("Connection refused. Is the server running?")
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed.")

if __name__ == "__main__":
    asyncio.run(listen_for_notifications())