# ~/sst_dev_and_dep/docker/signaling/Dockerfile

# Python 3.9 슬림 버전을 기반으로 이미지 생성
FROM python:3.9-slim

# 작업 디렉터리 설정
WORKDIR /app

# 필요한 라이브러리 목록 파일 복사
COPY requirements.txt .

# 라이브러리 설치
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 컨테이너가 8443 포트를 외부에 공개하도록 설정
EXPOSE 8443

# 컨테이너 시작 시 실행할 명령어
CMD ["python", "signaling_server.py"]