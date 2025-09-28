# AI 포팅 메뉴얼
## 개요
- 이상치 탐지 모델(Inference) 서버
- 하드룰 + ML 모델(IsolationForest + OneClassSVM) 기반
- 백엔드 API와 연동하여 위험 수준 업데이트

## 호환성 및 버전
### 개발환경
- Python: `3.13.4`
- OS: `Ubuntu 22.04 LTS` , `macOS 13+ (Apple Silicon/Intel)`, `Windows 11`
- CPU: `x86_64 (EC2)`, `arm64 (Apple Silicon)` 모두 동작 확인

### 런타임 의존성
- fastapi: `0.112.2`
- uvicorn: `0.30.6`
- pydantic: `2.8.2`
- pydantic-settings: `2.10.1`
- numpy: `1.26.4`
- pandas: `2.2.2`
- scikit-learn: `1.7.2`
- joblib: `1.4.2`
- redis: `5.0.8`
- requests: `2.32.3`
- boto3: `1.35.20`
- loguru: `0.7.2`
- certifi: `2025.8.3`

### 추론 설정 (from `.env` / `src.config`)
- tick_seconds: `10`
- thresholds: warn=`0.6`, danger=`1.0`

## 디렉토리 구조
```bash
ai-server/
├── models/      # 로컬 모델 파일 캐시
├── src/         # FastAPI 앱 및 내부 로직
├── tests/       # 테스트 코드
├── .env.example
├── requirements-mac.txt
├── requirements-win.txt
├── requirements-ec2.txt
└── README.md
```

## 설치 방법
### 1. 가상환경 생성
```bash
# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Windows (PowerShell)
```bash
py -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. 의존성 설치
```bash
# macOS/Linux
pip install -r requirements-mac.txt

# Windows
pip install -r requirements-win.txt

# EC2(Ubuntu 등 Linux 서버)
pip install -r requirements-ec2.txt
```

### 3. 환경변수 설정
```bash
# 실제 환경에 맞게 값 수정
cp .env.example .env
```

### 4. 서버 실행
```bash
uvicorn src.app:app --host 0.0.0.0 --port 9000 --reload
```

### 5. 헬스/스키마 확인
```bash
curl -s http://localhost:9000/health
curl -s "http://localhost:9000/health?deep=true"
curl -s http://localhost:9000/ai/schema
```

### 6. 주요 엔드포인트
- `POST /ai/tick` : 단일 틱 수신 → 저장 → 자동 추론 → (필요 시) 백엔드 보고
- Body:
```json
{
  "senior_id": 1,
  "timestamp": "2025-09-20T11:00:10Z",
  "data": {
    "door_bedroom": 0, "door_bathroom": 0, "door_entrance": 0, "door_fridge": 1,
    "pir_bedroom": 0, "pir_livingroom": 0, "pir_bathroom": 0,
    "light_bedroom": 0, "light_livingroom": 0, "light_bathroom": 0, "tv": 0
  }
}
```
  - 값 정규화 규칙: `True, true, "1", "true", "on", "open", 1` → `1`, 그 외 `0`.
  - 서버는 11개 센서 키 모두를 요구(`GET /ai/schema` 참고). 누락 시 422.

- `POST /ai/infer` : 배치 추론(디버그/백필용)
- `GET /ai/ticks/recent` : 최근 N초 틱 프리뷰
- `GET /ai/risk-latch` : 래치 상태 조회
- `POST /ai/risk-clear` : 래치 해제(백엔드 조치 완료 후 호출)

### 7. 백엔드 콜백 (AI서버 → 백엔드)
- `PUT /seniors/{senior_id}/risk-level`
- Body
```json
{ "risk_level": "안전|주의|위험", "reason": "룰/ML 근거 문자열" }
```
- 래치 정책:
  - `위험` 최초 감지 시: 보고 + 래치 ON
  - 래치 ON 상태: 모든 보고 억제(위험/주의/안전 불문)
  - 백엔드에서 현장 조치 완료 시 `POST /ai/risk-clear` 호출 → 이후 보고 재개

### 8. Redis & 원격 개발 팁
- EC2에서 Redis를 Docker로 실행 중이라면 로컬에서 SSH 터널로 연결:
```bash
ssh -i "your.pem" -N -L 16379:127.0.0.1:6379 ubuntu@your_ip
```

- `.env` 예시
```ini
REDIS_ENABLED=true
REDIS_URL=redis://127.0.0.1:16379/0
REDIS_PASSWORD=your_password
```

### 9. 테스트 스크립트
- `tests/test_latch.sh` : 래치(ON→억제→해제→재전송) 시나리오 자동 검증
```bash
chmod +x tests/test_latch.sh
./tests/test_latch.sh
```

- `tests/test_rules_ml.sh` : 모든 하드룰 시나리오 자동 검증    
```bash
chmod +x tests/test_rules_ml.sh
./tests/test_rules_ml.sh
```

- `tests/test_ml_safe.sh` : 정상 감지 30틱 시나리오 자동 검증
```bash
chmod +x tests/test_ml_safe.sh
./tests/test_ml_safe.sh
```

### 10. Q&A
- **왜 `BACK_END_TOCKEN` 인가요?**
  - 코드에서 `settings.back_end_token`을 읽도록 되어 있어, ENV 키는 `BACK_END_TOKEN`가 맞습니다.

- **S3 변수는 어떤 걸 써야 하나요?**
  - 현재 배포 구성은 `S3_MODEL_PREFIX=s3://bucket/prefix/` 형태를 사용합니다. 다른 키를 쓰려면 `src/models_loader.py` 설정과 맞춰 주세요. 