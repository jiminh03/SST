# publisher.py
import redis
import time
import json

import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

r = redis.Redis(
    host=os.getenv("REDIS_HOST"), 
    port=os.getenv("REDIS_PORT"), 
    password=os.getenv("REDIS_PASSWORD")
)

channel_name = 'emergency_alerts'

print("📢 발행자(Publisher) 시작. 3초마다 긴급 알림을 발행합니다.")

for i in range(5):
    # 실제 데이터는 보통 JSON 형식으로 직렬화하여 보냅니다.
    message = {
        "senior_id": 101,
        "event_type": "fall_detected",
        "timestamp": time.time()
    }
    
    # publish(채널이름, 메시지): 특정 채널로 메시지를 발행
    r.publish(channel_name, json.dumps(message))
    print(f"'{channel_name}' 채널에 메시지 발행: {message}")
    
    time.sleep(3)

print("📢 발행자(Publisher) 종료.")