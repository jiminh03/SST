# subscriber.py
import json
import redis
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# --- 1. Redis 서버에 연결 ---
#: Redis에서 받은 데이터를 자동으로 utf-8 문자열로 변환해 줍니다.
# 이 옵션이 없으면 b'...' 형태의 바이트(bytes)로 반환됩니다.
r = redis.Redis(
    host=os.getenv("REDIS_HOST"), 
    port=os.getenv("REDIS_PORT"), 
    password=os.getenv("REDIS_PASSWORD"),
    #decode_responses=True
)

channel_name = 'emergency_alerts'

# 1. PubSub 객체 생성
pubsub = r.pubsub()

# 2. 구독할 채널 등록
pubsub.subscribe(channel_name)

print(f"📥 구독자(Subscriber) 시작. '{channel_name}' 채널을 구독합니다...")

# 3. 메시지를 계속 기다리며 수신 (Blocking)
for message in pubsub.listen():
    # 처음 연결 시에는 'subscribe' 메시지를 받습니다.
    if message['type'] == 'message':
        # 실제 데이터는 'data' 필드에 담겨 옵니다. (bytes 형태이므로 decode 필요)
        data = message['data'].decode('utf-8')
        event_data = json.loads(data)
        
        print(f"📬 메시지 수신! -> {event_data}")
        # 여기에 WebSocket 알림 전송, DB 기록 등 실제 로직이 들어갑니다.