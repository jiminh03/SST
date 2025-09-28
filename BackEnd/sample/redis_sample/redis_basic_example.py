# redis_basic_example.py

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
    decode_responses=True
)

# 연결 확인
try:
    r.ping()
    print("✅ Redis에 성공적으로 연결되었습니다.")
except redis.exceptions.ConnectionError as e:
    print(f"❌ Redis 연결 실패: {e}")
    exit()

print("-" * 30)

# --- 2. 문자열(String) 데이터 쓰고 읽기 ---
# set(key, value): 가장 기본적인 Key-Value 저장
print("1. 문자열 데이터 저장 및 조회")
r.set('user:101:name', '박영식')

# get(key): Key에 해당하는 Value 조회
user_name = r.get('user:101:name')
print(f"user:101:name 조회 결과: {user_name}")

# 존재하지 않는 키 조회 시에는 None이 반환됩니다.
non_existent_user = r.get('user:999:name')
print(f"user:999:name 조회 결과: {non_existent_user}")

print("\n" + "-" * 30)

# --- 3. 만료 시간(TTL) 설정하여 캐싱하기 ---
# set(key, value, ex=만료시간(초)): 데이터가 일정 시간 후에 자동으로 삭제되도록 설정
print("2. 5초 후에 만료되는 데이터 캐싱")
r.set('status:senior_101', 'safe', ex=5)
print(f"status:senior_101 저장됨 (5초 후 만료)")

# ttl(key): 해당 Key의 남은 수명(초) 확인
print(f"남은 시간: {r.ttl('status:senior_101')}초")

print("\n" + "-" * 30)

# --- 4. 딕셔너리(Hash) 데이터 쓰고 읽기 ---
# Hash는 하나의 Key 아래에 여러 필드-값 쌍을 저장할 수 있어 객체 캐싱에 유용합니다.
print("3. 딕셔너리(Hash) 데이터 저장 및 조회")
profile_data = {
    "full_name": "김은정",
    "role": "caregiver",
    "assigned_seniors": 5
}
# hset(key, mapping=딕셔너리): Hash 데이터 저장
r.hset('staff:201:profile', mapping=profile_data)

# hgetall(key): Hash 데이터 전체 조회
staff_profile = r.hgetall('staff:201:profile')
print(f"staff:201:profile 조회 결과: {staff_profile}")
print(f"조회된 이름: {staff_profile['full_name']}")