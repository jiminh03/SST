import httpx
import asyncio

TARGET_CLIENT_ID = "staff_monitor_1" # 알림을 보낼 대상 클라이언트 ID

async def trigger_connection_request():
    """
    백엔드 API를 호출하여 웹소켓 연결 시작을 요청합니다.
    """
    url = f"http://localhost:8000/request-connection/{TARGET_CLIENT_ID}"
    print(f"Sending HTTP request to {url}...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url)
            
            if response.status_code == 200:
                print(f"Server response: {response.json()}")
            else:
                print(f"Error: {response.status_code} - {response.text}")

    except httpx.ConnectError:
        print("Connection failed. Is the backend server running?")

if __name__ == "__main__":
    asyncio.run(trigger_connection_request())