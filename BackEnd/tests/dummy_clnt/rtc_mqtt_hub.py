#!/usr/bin/env python3
"""
허브(중계): Robot(MQTT) ↔ Backend(Socket.IO)
- 서버→허브: NEW_ANSWER / NEW_ICE_CANDIDATE / REQUEST_SAFETY_CHECK
  → 허브가 MQTT로 로봇에 전달
- 로봇→허브: offer / ice / safety/result
  → 허브가 Socket.IO로 서버에 emit
"""
import os
import json
import asyncio
import logging
from typing import Any, Dict

import socketio
import orjson
import paho.mqtt.client as mqtt

from socket_event import ConnectEvents, WebRTCEvents, AlarmEvents, NotifyEvents

# ===== 설정 (기존과 동일) =====
SERVER_ADDRESS = os.getenv("SIGNAL_SERVER", "https://j13a503.p.ssafy.io")
API_KEY        = os.getenv("API_KEY", "20gxF6G1MgMwcZ0h6eGTuivXRwwu1KsqwsJh9N9JBS0")
SENIOR_ID      = int(os.getenv("SENIOR_ID", "17"))

TEAM           = os.getenv("TEAM", "503")
ROBOT_ID       = os.getenv("ROBOT_ID", "r1")

MQTT_HOST      = os.getenv("MQTT_HOST", "127.0.0.1")
MQTT_PORT      = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USER      = os.getenv("MQTT_USER", "")
MQTT_PASS      = os.getenv("MQTT_PASS", "")

# ===== 토픽 규칙 (기존과 동일) =====
T_ROBOT_OFFER = f"home/{TEAM}/robot/{ROBOT_ID}/webrtc/offer"
T_ROBOT_ICE   = f"home/{TEAM}/robot/{ROBOT_ID}/webrtc/ice"
T_SAFETY_RES  = f"home/{TEAM}/robot/{ROBOT_ID}/safety/result"
T_TO_ROBOT_ANS = f"home/{TEAM}/robot/{ROBOT_ID}/webrtc/answer"
T_TO_ROBOT_ICE = f"home/{TEAM}/robot/{ROBOT_ID}/webrtc/ice"
T_SAFETY_REQ   = f"home/{TEAM}/robot/{ROBOT_ID}/safety/request"

# --- 추가: 위험모드 명령, 게임 종료 결과
T_CMD_IS_DANGER   = f"home/{TEAM}/robot/{ROBOT_ID}/cmd/is_danger"   # 허브→로봇
T_GAME_FINALIZED  = f"home/{TEAM}/robot/{ROBOT_ID}/game/finalized"  # 로봇→허브

# ===== 로깅 및 전역 인스턴스 (기존과 동일) =====
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("rtc_hub")
sio = socketio.AsyncClient(logger=True, engineio_logger=True)
mqttc = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id=f"hub-{TEAM}-{ROBOT_ID}",
    clean_session=True
)

# ===== 유틸 및 MQTT 발행 헬퍼 (기존과 동일) =====
def _dumps(obj: Dict[str, Any]) -> bytes:
    try: return orjson.dumps(obj)
    except Exception: return json.dumps(obj, ensure_ascii=False).encode("utf-8")

def _loads(payload: bytes) -> Dict[str, Any]:
    try: return orjson.loads(payload)
    except Exception: return json.loads(payload.decode("utf-8"))

def mqtt_publish(topic: str, data: Dict[str, Any], qos: int = 1) -> None:
    try: mqttc.publish(topic, _dumps(data), qos=qos, retain=False)
    except Exception as e: logger.error(f"MQTT publish error to {topic}: {e}")

def mqtt_send_safety_check(to_robot: str) -> None:
    mqtt_publish(T_SAFETY_REQ, {"type": "safety_check", "action": "check", "to": f"robot-{to_robot}"})

def mqtt_send_answer(to_robot: str, answer: Dict[str, Any]) -> None:
    mqtt_publish(T_TO_ROBOT_ANS, {"type": answer.get("type"), "sdp": answer.get("sdp"), "to": f"robot-{to_robot}"})

def mqtt_send_ice(to_robot: str, ice: Dict[str, Any]) -> None:
    mqtt_publish(T_TO_ROBOT_ICE, {"type": "ice", "candidate": ice, "dir": "to-robot", "to": f"robot-{to_robot}"})

def mqtt_send_is_danger(flag: bool, reason: str | None = None) -> None:
    payload = {"is_danger": bool(flag), "ts": int(asyncio.get_event_loop().time() * 1000)}
    if reason: payload["reason"] = reason
    mqtt_publish(T_CMD_IS_DANGER, payload)

def mqtt_send_ack_debug(note: str) -> None:
    # 필요하면 로컬 디버깅용으로 로봇에게 알림
    mqtt_publish(f"home/{TEAM}/hub/debug", {"note": note, "ts": int(asyncio.get_event_loop().time() * 1000)})


# ===== Socket.IO 핸들러 (기존과 동일) =====

@sio.event
async def disconnect():
    logger.info("서버와의 연결이 끊어졌습니다.")

@sio.on(AlarmEvents.REQUEST_SAFETY_CHECK)
async def on_request_safety_check():
    logger.info("[SIO][ALARM] REQUEST_SAFETY_CHECK → robot")
    mqtt_send_safety_check(ROBOT_ID)
    mqtt_send_is_danger(True, reason="safety_request")
    await sio.emit(AlarmEvents.ACK_SAFETY_CHECK, {
        "senior_id": SENIOR_ID,
        "robot_id": ROBOT_ID,
        "ok": True,
    })

@sio.on(WebRTCEvents.NEW_ANSWER)
async def on_new_answer(data):
    logger.info("[SIO][WebRTC] NEW_ANSWER ← server → MQTT → robot")
    mqtt_send_answer(ROBOT_ID, data)

@sio.on(WebRTCEvents.NEW_ICE_CANDIDATE)
async def on_ice_candidate(data):
    logger.info("[SIO][WebRTC] NEW_ICE_CANDIDATE ← server → MQTT → robot")
    mqtt_send_ice(ROBOT_ID, data)

# --- ❗ 변경점 1: MQTT 메시지를 비동기적으로 처리할 별도의 핸들러 함수들 ---
async def handle_robot_offer(data: Dict[str, Any]):
    """로봇의 Offer를 서버로 전송하는 비동기 핸들러"""
    await sio.emit(WebRTCEvents.REGISTER_OFFER, (SENIOR_ID, data))
    logger.info("[MQTT→SIO] REGISTER_OFFER sent")

async def handle_robot_ice(data: Dict[str, Any]):
    """로봇의 ICE Candidate를 서버로 전송하는 비동기 핸들러"""
    await sio.emit(WebRTCEvents.NEW_ICE_CANDIDATE, (SENIOR_ID, data))
    logger.info("[MQTT→SIO] NEW_ICE_CANDIDATE sent")

async def handle_safety_result(status: str):
    """로봇의 안전 체크 결과를 서버로 전송하는 비동기 핸들러"""
    if status == "safe":
        await sio.emit(AlarmEvents.SENIOR_IS_SAFE)
        logger.info("[MQTT→SIO][ALARM] SENIOR_IS_SAFE")
    elif status == "emergency":
        await sio.emit(AlarmEvents.EMERGENCY_SITUATION)
        logger.info("[MQTT→SIO][ALARM] EMERGENCY_SITUATION")
async def handle_game_finalized(data: Dict[str, Any]):
    """
    로봇이 게임 종료를 알림:
      {"finalized": true/false, "reason": "...", ...}
    """
    finalized = data.get("finalized")
    if finalized is True:
        # 허브 → 서버: 어르신 안전 보고
        await sio.emit(AlarmEvents.REPORT_SENIOR_IS_SAFE, {
            "senior_id": SENIOR_ID,
            "robot_id": ROBOT_ID,
            "detail": data
        })
        logger.info("[MQTT→SIO][ALARM] REPORT_SENIOR_IS_SAFE")
    elif finalized is False:
        # 허브 → 서버: 센서/상황 이벤트 전파 (요청 명세대로 server:notify_sensor_event 사용)
        await sio.emit(NotifyEvents.NOTIFY_SENSOR_EVENT, {
            "senior_id": SENIOR_ID,
            "robot_id": ROBOT_ID,
            "event": "game_failed",
            "detail": data
        })
        logger.info("[MQTT→SIO][NOTIFY] server:notify_sensor_event (game_failed)")
    else:
        logger.warning("[MQTT] game finalized payload missing 'finalized' boolean")

@sio.on(AlarmEvents.EMERGENCY_SITUATION)
async def on_emergency_situation(data):
    """
    서버 → 허브 : 응급상황 전파
    해야 할 일:
      1) 허브→로봇 : is_danger=true (MQTT)
      2) 허브→서버 : hub:ack_safety_check (ACK)
    """
    logger.info(f"[SIO][ALARM] EMERGENCY_SITUATION → MQTT is_danger=true | data={data}")

    # 1) 로봇 위험모드 on
    mqtt_send_is_danger(True, reason="emergency_situation")

    # 2) 서버에 ACK
    try:
        await sio.emit(AlarmEvents.ACK_SAFETY_CHECK, {
            "senior_id": SENIOR_ID,
            "robot_id": ROBOT_ID,
            "ok": True,
        })
        logger.info("[SIO] ACK_SAFETY_CHECK sent")
    except Exception as e:
        logger.error(f"[SIO] ACK emit error: {e}")


# ===== MQTT 콜백 (로봇→허브) =====
def on_mqtt_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        logger.info("[MQTT] connected")
        client.subscribe([(T_ROBOT_OFFER, 1), (T_ROBOT_ICE, 1), (T_SAFETY_RES, 1), (T_GAME_FINALIZED, 1),])
    else:
        logger.error(f"[MQTT] connect failed rc={rc}")

# --- ❗ 변경점 2: on_mqtt_message 콜백 리팩토링 ---
def on_mqtt_message(client, userdata, msg):
    """
    Paho-MQTT 스레드에서 실행되는 동기 콜백.
    메인 asyncio 이벤트 루프에 비동기 작업을 스케줄링하는 역할만 수행.
    """
    main_loop = userdata  # userdata를 통해 메인 이벤트 루프를 가져옴
    try:
        data = _loads(msg.payload)
    except Exception as e:
        logger.warning(f"[MQTT] invalid json on {msg.topic}: {e}")
        return

    # 각 토픽에 맞는 비동기 핸들러를 메인 루프에서 실행하도록 스케줄링
    if msg.topic == T_ROBOT_OFFER and data.get("type") == "offer":
        asyncio.run_coroutine_threadsafe(handle_robot_offer(data), main_loop)

    elif msg.topic == T_ROBOT_ICE and data.get("type") == "ice":
        asyncio.run_coroutine_threadsafe(handle_robot_ice(data), main_loop)

    elif msg.topic == T_SAFETY_RES and data.get("status"):
        asyncio.run_coroutine_threadsafe(handle_safety_result(data["status"]), main_loop)
        
    elif msg.topic == T_GAME_FINALIZED:
        asyncio.run_coroutine_threadsafe(handle_game_finalized(data), main_loop)
# ===== 실행 =====
mqttc.on_connect = on_mqtt_connect
mqttc.on_message = on_mqtt_message

def start_mqtt():
    if MQTT_USER:
        mqttc.username_pw_set(MQTT_USER, MQTT_PASS or None)
    mqttc.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    mqttc.loop_start()

async def main():
    # --- ❗ 변경점 3: 메인 이벤트 루프를 가져와 userdata에 설정 ---
    main_event_loop = asyncio.get_running_loop()
    mqttc.user_data_set(main_event_loop)

    start_mqtt()
    try:
        await sio.connect(SERVER_ADDRESS, socketio_path="/socket.io",auth={"api_key":API_KEY})
        await sio.wait()
    except Exception as e:
        logger.error(f"[SIO] error: {e}")
    finally:
        if sio.connected:
            await sio.disconnect()
        mqttc.loop_stop()
        mqttc.disconnect()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("bye")
