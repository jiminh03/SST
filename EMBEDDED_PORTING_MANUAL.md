# 시뮬레이션 포팅 메뉴얼 (Raspberry Pi - Ethernet & MQTT)

> 대상: Raspberry Pi OS (Bookworm/ Bullseye), 프로젝트: SSAFAT / HomeHub (예: 팀 503)
>
> 목적: **이더넷 직결/유선망 통신**과 **Mosquitto MQTT 브로커**를 **동일 환경으로 재현(포팅)**할 수 있도록 표준 절차와 체크리스트 제공

---

## 0) TL;DR – 10분 포팅 체크리스트

- [ ] `hostnamectl set-hostname rpi-hub503` (선택)
- [ ] `timedatectl set-timezone Asia/Seoul`
- [ ] 필수 패키지 설치: `sudo apt update && sudo apt install -y network-manager mosquitto mosquitto-clients ufw python3-venv`
- [ ] **이더넷(static IP)** 설정 (Bookworm 기본: NetworkManager)
  - [ ] RPi: `10.42.0.219/24`, 게이트웨이(직결이면 생략), DNS(옵션)
  - [ ] 노트북/PC: `10.42.0.1/24`
- [ ] **Mosquitto** 하드닝 & 계정 생성
  - [ ] `/etc/mosquitto/conf.d/503.conf` 배치
  - [ ] `sudo mosquitto_passwd -c /etc/mosquitto/passwd unityuser`
  - [ ] `sudo systemctl enable --now mosquitto`
- [ ] 방화벽 허용: `sudo ufw allow 1883/tcp && sudo ufw allow 9001/tcp`(웹소켓 사용시)
- [ ] 퍼블/섭스크 테스트: `mosquitto_sub` / `mosquitto_pub`
- [ ] (옵션) `hub_forwarder.py` 가상환경 구성 및 systemd 등록

---

## 1) 시스템 기본 설정

```bash
# 호스트명(선택)
sudo hostnamectl set-hostname rpi-hub503

# 시간대
sudo timedatectl set-timezone Asia/Seoul

# 업데이트 & 필수 도구
sudo apt update && sudo apt upgrade -y
sudo apt install -y network-manager mosquitto mosquitto-clients ufw python3-venv git
```

> **참고**: Raspberry Pi OS Bookworm은 기본 네트워킹이 **NetworkManager**입니다. Bullseye/구버전(dhcpcd)일 경우 1.2 절 참고.

### 1.1 NetworkManager(권장, Bookworm)에서 이더넷 고정 IP

RPi ↔ 노트북 직결 시(크로스/일반 케이블 자동 MDI-X):
- **RPi**: `10.42.0.219/24`
- **노트북/PC**: `10.42.0.1/24`

```bash
# 유선 인터페이스 확인 (일반적으로 eth0)
nmcli device status

# 유선 프로파일 생성 또는 수정
sudo nmcli con add type ethernet ifname eth0 con-name wired-static || true
sudo nmcli con mod wired-static ipv4.addresses 10.42.0.219/24
sudo nmcli con mod wired-static ipv4.method manual
# 게이트웨이/인터넷 공유가 없다면 gateway는 생략 가능
# DNS 필요시: sudo nmcli con mod wired-static ipv4.dns 1.1.1.1,8.8.8.8

# 연결 적용
sudo nmcli con up wired-static

# 확인
ip addr show eth0
ping -c 2 10.42.0.1   # PC 주소
```

> **우선 순위(메트릭)**: 동시에 Wi‑Fi가 연결되어 있고, 이더넷을 우선 사용하려면
```bash
sudo nmcli con mod wired-static ipv4.route-metric 10  # 낮을수록 우선
sudo nmcli con up wired-static
```

### 1.2 (구버전) dhcpcd 사용 시 고정 IP
`/etc/dhcpcd.conf` 맨 아래 추가:
```conf
interface eth0
static ip_address=10.42.0.219/24
# static routers=10.42.0.1      # 필요 시
# static domain_name_servers=1.1.1.1 8.8.8.8
```
적용:
```bash
sudo systemctl restart dhcpcd
```

---

## 2) Mosquitto MQTT 브로커 설정

### 2.1 설치 & 서비스 활성화
```bash
sudo apt install -y mosquitto mosquitto-clients
sudo systemctl enable --now mosquitto
sudo systemctl status mosquitto --no-pager
```

### 2.2 표준 설정 파일(`/etc/mosquitto/conf.d/503.conf`)
아래 내용을 **새 파일**로 저장:
```conf
# /etc/mosquitto/conf.d/503.conf

# 기본 리스너 (TCP)
listener 1883 0.0.0.0
protocol mqtt

# (옵션) 웹소켓 리스너 – Unity/웹 클라이언트용
# listener 9001 0.0.0.0
# protocol websockets

# 인증/보안
allow_anonymous false
password_file /etc/mosquitto/passwd

# 영속화(브로커 재시작 후 retain/QoS1/2 복구)
persistence true
persistence_location /var/lib/mosquitto/
autosave_interval 60

# 로깅
log_dest syslog
log_dest file /var/log/mosquitto/mosquitto.log
log_type error
log_type warning
log_type notice
log_type information

# (옵션) ACL: 팀 503 토픽만 허용
# acl_file /etc/mosquitto/aclfile
```

**패스워드 & (옵션) ACL 생성**
```bash
# 사용자 생성 (예: unityuser)
sudo mosquitto_passwd -c /etc/mosquitto/passwd unityuser
# 비밀번호 입력 (repo에는 비번을 커밋하지 마세요)

# (옵션) ACL 제한: 특정 사용자에게 특정 토픽 접근 허용
cat <<'EOF' | sudo tee /etc/mosquitto/aclfile
user unityuser
pattern readwrite home/503/#
EOF
```

적용:
```bash
sudo systemctl restart mosquitto
sudo journalctl -u mosquitto -n 50 --no-pager
```

> **중요**: `persistence_location`은 **단 한 곳**만 지정하세요. 여러 conf 조합으로 **중복 지정**되면 에러 및 재시작 루프가 납니다. 기본 `/etc/mosquitto/mosquitto.conf`가 다른 설정을 포함한다면, **conf.d**에 둔 파일과 충돌하지 않도록 불필요한 줄을 주석 처리하세요.

### 2.3 방화벽(UFW) 허용
```bash
sudo ufw allow 1883/tcp
# 웹소켓 사용 시
sudo ufw allow 9001/tcp
sudo ufw enable   # 최초 1회, SSH 포트(22)는 자동 허용되지만 확인 권장
sudo ufw status
```

### 2.4 퍼블/섭스크 동작 확인
```bash
# 구독 (백그라운드)
mosquitto_sub -h 10.42.0.219 -t "home/503/#" -u unityuser -P '****' -q 1 -v &

# 발행 (다른 쉘)
mosquitto_pub -h 10.42.0.219 -t "home/503/hub/status" -m '{"status":"up"}' -u unityuser -P '****' -q 1
```
출력이 다음과 유사하면 성공:
```
home/503/hub/status {"status":"up"}
```

> **QoS 가이드**:
> - 센서 신뢰성 필요: **QoS=1** 권장(중복 수신 대비 로직 필요)
> - 상태 브로드캐스트/로그: QoS=0 가능
> - **retain**은 최근 상태 유지가 필요할 때만 신중히 사용

---

## 3) Unity/백엔드 연계 기준값 (예시)

- 브로커 호스트: `10.42.0.219`
- 포트: `1883` (또는 `9001` 웹소켓)
- 토픽 네임스페이스: `home/503/...`
  - 예: `home/503/living/door_entrance`, `home/503/hub/status`
- 크리덴셜: `unityuser` / (비밀번호는 **로컬 .env 또는 시크릿**)

> **Unity**에서 MQTT 라이브러리(M2Mqtt 등) 사용 시, 에디터와 플레이어에서 동일 호스트/포트를 쓰되, **네트워크 우선순위가 이더넷**이 되도록 OS 측 설정을 먼저 맞추세요.

---

## 4) Python 허브(Forwarder) 서비스 등록 (옵션)

### 4.1 가상환경 & 의존성
```bash
cd ~/SSAFAT/hub  # 예시 경로
python3 -m venv .venv
source .venv/bin/activate

# paho-mqtt v2 관련 호환성 이슈가 있다면 v1 계열 고정 권장
pip install --upgrade pip
pip install "paho-mqtt<2" requests
```

> **참고: paho-mqtt v2 오류**
> `module 'paho.mqtt.client' has no attribute 'CallbackAPIVersion'` → 코드를 v2 API로 바꾸거나, **의존성을 `<2`로 고정**하세요.

### 4.2 환경변수(.env)
```
MQTT_HOST=10.42.0.219
MQTT_PORT=1883
SUB_TOPIC=home/503/#
BACKEND_URL=http://<backend-host>:8000/iot/logs
MQTT_USER=unityuser
MQTT_PASS=****
```

### 4.3 systemd 유닛 파일
`/etc/systemd/system/hub-forwarder.service`:
```ini
[Unit]
Description=Hub Forwarder (MQTT → Backend)
After=network-online.target mosquitto.service
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/SSAFAT/hub
EnvironmentFile=/home/pi/SSAFAT/hub/.env
ExecStart=/home/pi/SSAFAT/hub/.venv/bin/python hub_forwarder.py
Restart=on-failure

[Install]
WantedBy=multi-user.target
```
적용:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hub-forwarder
sudo journalctl -u hub-forwarder -f
```

---

## 5) 로그/진단 빠른 명령어

```bash
# 네트워크
ip -br a            # 인터페이스 요약
nmcli device show   # 상세
ping -c 3 10.42.0.1 # PC로 핑

# 모스키토
sudo systemctl status mosquitto --no-pager
sudo journalctl -u mosquitto -n 100 --no-pager
sudo tail -n 200 /var/log/mosquitto/mosquitto.log

# 포트 바인딩
sudo ss -lntp | grep -E '1883|9001'

# 퍼블/섭스크
mosquitto_sub -h 10.42.0.219 -t 'home/503/#' -u unityuser -P '****' -q 1 -v &
mosquitto_pub -h 10.42.0.219 -t 'home/503/test' -m 'hello' -u unityuser -P '****'
```

---

## 6) 흔한 이슈 & 해결법

| 증상 | 원인 | 해결 |
|---|---|---|
| `Connection refused` | 브로커 다운/포트 미오픈/방화벽 | `systemctl status mosquitto`, UFW 1883 허용, `ss -lntp`로 포트 확인 |
| 재시작 루프, 설정 에러 | `persistence_location` 중복, 구문 오류 | `/etc/mosquitto/mosquitto.conf`와 `conf.d/*.conf` 충돌 제거, `mosquitto -c /etc/mosquitto/mosquitto.conf -v`로 구문 점검 |
| Unity는 되는데 외부 장치 안 붙음 | 이더넷/와이파이 우선순위 역전 | `ipv4.route-metric` 조정, 정적 라우팅 점검 |
| `CallbackAPIVersion` 에러 | paho-mqtt v2 비호환 | `pip install "paho-mqtt<2"` 또는 코드 수정 |
| 토픽은 보이는데 값 뒤섞임 | QoS/retain 설계 문제 | QoS=1 + 중복 처리, retain 최소화, 세션 클린/ID 관리 |
| 비번 노출 | 평문 커밋 | `.env` 사용, `.gitignore`로 비공개 유지 |

---

## 7) 리포지토리 반영 가이드(README 템플릿)

아래 블록을 프로젝트 README에 그대로 붙여넣으세요.

```markdown
## 🔌 Raspberry Pi 포팅 요약 (Ethernet & MQTT)

**Raspberry Pi (Bookworm) + NetworkManager** 기준

1. 패키지
   ```bash
   sudo apt update && sudo apt install -y network-manager mosquitto mosquitto-clients ufw python3-venv
   ```
2. 이더넷 고정 IP
   ```bash
   sudo nmcli con add type ethernet ifname eth0 con-name wired-static || true
   sudo nmcli con mod wired-static ipv4.addresses 10.42.0.219/24
   sudo nmcli con mod wired-static ipv4.method manual
   sudo nmcli con mod wired-static ipv4.route-metric 10
   sudo nmcli con up wired-static
   ```
3. Mosquitto 설정(`/etc/mosquitto/conf.d/503.conf`)
   ```conf
   listener 1883 0.0.0.0
   allow_anonymous false
   password_file /etc/mosquitto/passwd
   persistence true
   persistence_location /var/lib/mosquitto/
   log_dest syslog
   log_dest file /var/log/mosquitto/mosquitto.log
   log_type error
   log_type warning
   log_type notice
   log_type information
   ```
   ```bash
   sudo mosquitto_passwd -c /etc/mosquitto/passwd unityuser
   sudo systemctl restart mosquitto
   ```
4. 방화벽
   ```bash
   sudo ufw allow 1883/tcp
   sudo ufw enable
   ```
5. 테스트
   ```bash
   mosquitto_sub -h 10.42.0.219 -t "home/503/#" -u unityuser -P '****' -q 1 -v &
   mosquitto_pub -h 10.42.0.219 -t "home/503/hub/status" -m '{"status":"up"}' -u unityuser -P '****' -q 1
   ```
```

---

## 8) 백업/복원 포인트

- 네트워크 프로파일: `/etc/NetworkManager/system-connections/`
- Mosquitto 설정: `/etc/mosquitto/`, 데이터: `/var/lib/mosquitto/`, 로그: `/var/log/mosquitto/`
- Python 허브 서비스: `/etc/systemd/system/hub-forwarder.service`, 앱 디렉토리(`~/SSAFAT/hub`)

**백업 예시**
```bash
sudo tar czf rpi-hub-backup_$(date +%F).tar.gz \
  /etc/NetworkManager/system-connections \
  /etc/mosquitto \
  /var/lib/mosquitto \
  /etc/systemd/system/hub-forwarder.service \
  /home/pi/SSAFAT/hub
```

---

## 9) 부록: 토픽 네이밍 & 페이로드 컨벤션(예시)

- 네임스페이스: `home/<team>/...` (예: `home/503/...`)
- 스테이트: `home/503/hub/status` → `{ "status": "up", "ts": 1758011506283 }`
- 센서: `home/503/living/door_entrance` →
  ```json
  {
    "ts": 1758011506283,
    "data": {
      "api_key": "DEV_KEY",
      "sensor_data": [
        {
          "sensor_type": "door_entrance",
          "sensor_value": false,
          "event_description": "문 닫힘",
          "timestamp": "2025-09-16 08:31:46",
          "room": "entrance",
          "device": "door"
        }
      ]
    }
  }
  ```

> **권장**: 모든 메시지에 `ts`(epoch ms) 포함, 서버 수신 시 중복 방지 키(예: `topic + ts`)로 멱등성 보장

---

## 10) 문의/운영 규칙(팀 503 예시)

- 운영 담당: 임베디드/허브 담당 1명, 백엔드 담당 1명(교대 On-call)
- 변경 시 PR & 코드리뷰 필수 (브로커 설정/허브 코드)
- 비밀번호는 `.env`로 관리, 레포에 커밋 금지
- 장애 발생 시: Mosquitto 로그 → 허브 서비스 로그 → 네트워크 확인 순서로 트리아지

---

**끝.** 필요 시 Unity/ROS2/Backend 연동 섹션도 이어서 확장 가능합니다.

