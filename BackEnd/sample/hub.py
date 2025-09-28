#!/usr/bin/env python3
import os, json, time, logging, datetime
import requests
from paho.mqtt import client as mqtt
from datetime import datetime

# ====== 환경설정 (ENV로 덮어쓰기 가능) ======
MQTT_HOST   = os.getenv("MQTT_HOST", "10.42.0.219")   # 라즈베리파이 브로커 IP
MQTT_PORT   = int(os.getenv("MQTT_PORT", "1883"))
SUB_TOPIC   = os.getenv("SUB_TOPIC", "home/503/#")

BACKEND_URL = os.getenv("BACKEND_URL", "http://j13a503.p.ssafy.io:8000/iot/logs")
API_KEY     = os.getenv("API_KEY", "20gxF6G1MgMwcZ0h6eGTuivXRwwu1KsqwsJh9N9JBS0")         # 발급키로 교체

TIMEOUT_S   = float(os.getenv("HTTP_TIMEOUT", "5"))
QOS         = int(os.getenv("MQTT_QOS", "1"))

# ====== 로깅 ======
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def iso_ts_seconds():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

ALLOWED_TYPES = {
    "door_bedroom", "door_bathroom",
    "door_entrance", "door_fridge",
    "pir_bedroom", "pir_livingroom", "pir_bathroom",
    "light_bedroom", "light_livingroom", "light_bathroom",
    "power_tv",
}


def normalize_payload(raw: str, topic: str):
    """
    - MQTT 페이로드를 파싱해 백엔드가 받는 형식으로 정규화
    - {"ts":..., "data": {...}} 형태도 처리
    - 허용되지 않은 sensor_type은 제거
    """
    try:
        data = json.loads(raw)
    except Exception:
        data = None
    
    # "data" 래퍼 풀기
    if isinstance(data, dict) and "data" in data and isinstance(data["data"], dict):
        data = data["data"]
    
    # 2) 정규 케이스: sensor_data 배열이 존재
    if isinstance(data, dict) and isinstance(data.get("sensor_data"), list):
        out = {
            "api_key": API_KEY,
            "sensor_data": []
        }
        print(out["api_key"])
        # ts는 버림
        # data.pop("ts", None)  # 상위에서 이미 제거됨

        for e in data["sensor_data"]:
            if not isinstance(e, dict):
                continue
            st = e.get("sensor_type")
            if st not in ALLOWED_TYPES:
                # 허용되지 않은 센서 타입은 무시
                continue
            out_item = {
                "sensor_type": st,
                "sensor_value": e.get("sensor_value"),
                "event_description": e.get("event_description"),
                "timestamp": e.get("timestamp")  # 그대로 사용
            }
            out["sensor_data"].append(out_item)

        return out if out["sensor_data"] else None


            # 3) 그 외는 무시(허용 안 함). 필요하면 fallback 만들 수 있음.
    return None

# ====== MQTT 콜백 ======
def on_connect(client, userdata, flags, rc):
    logging.info(f"[MQTT] connected rc={rc} → SUB '{SUB_TOPIC}' (QoS {QOS})")
    client.subscribe(SUB_TOPIC, qos=QOS)
def on_message(client, userdata, msg):
    if msg.retain:
        # retained 메시지는 건너뛰기
        return
    payload = msg.payload.decode("utf-8", errors="ignore")
    logging.info(f"[MQTT <-] {msg.topic} {payload}")

    body = normalize_payload(payload, msg.topic)
    if not body:
        logging.info("[SKIP] not a valid/allowed sensor payload")
        return

    try:
        r = requests.post(BACKEND_URL, json=body, timeout=TIMEOUT_S)
        logging.info(f"[HTTP ->] {BACKEND_URL} {r.status_code} {r.text[:200]}")
    except Exception as e:
        logging.error(f"[HTTP !!] {e}")

def main():
    while True:
        try:
            c = mqtt.Client(client_id="pi-hub-forwarder", clean_session=True)
            c.will_set("home/503/hub/status", payload='{"status":"down"}', qos=1, retain=True)
            c.on_connect = on_connect
            c.on_message = on_message
            c.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
            # 허브 온라인 표시
            c.publish("home/503/hub/status", payload='{"status":"up"}', qos=1, retain=True)
            c.loop_forever()
        except Exception as e:
            logging.error(f"[MQTT !!] {e} — 3초 후 재시도")
            time.sleep(3)

if __name__ == "__main__":
    main()