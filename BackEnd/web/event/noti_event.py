# 허브나 FE로 보내는 각종 알림
#이상치 감지 알림, 로봇의 응급 상황알림을 FE, BACK, HUB에서 주고 받을 패킷을 정의해야함

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum

# --- 1. 열거형(Enum)을 사용한 명확한 타입 정의 ---

class EventType(Enum):
    """이벤트의 종류를 정의합니다."""
    ANOMALY_DETECTION = "anomaly_detection"
    EMERGENCY_ALERT = "emergency_alert"
    # 필요에 따라 다른 이벤트 타입 추가 가능
    # STATUS_UPDATE = "status_update"

class SeverityLevel(Enum):
    """이상치 감지의 심각도를 정의합니다."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class EmergencyCode(Enum):
    """응급 상황의 종류를 나타내는 코드입니다."""
    E_STOP_PRESSED = "E-001"
    OBSTACLE_COLLISION = "E-002"
    FALL_DETECTED = "E-003"
    LOW_BATTERY_SHUTDOWN = "E-004"


# --- 2. 모든 패킷이 공통으로 가질 기본 구조 ---

@dataclass
class BasePacket:
    """모든 알림 패킷의 기본이 되는 클래스입니다."""
    
    # from_dict 클래스 메서드를 위한 타입 힌트 (Python 3.11+ 에서 Self 사용 가능)
    # from typing import Self 

    event_type: EventType  # 이벤트 종류 (이상치, 응급 상황 등)
    source: str            # 발생 주체 (예: 'robot-01', 'hub-server')
    
    # UTC 기준으로 현재 시간을 ISO 8601 형식 문자열로 자동 생성
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    
    # 각 이벤트를 식별하기 위한 고유 ID 자동 생성
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def to_dict(self) -> dict:
        """클래스 인스턴스를 socket.io로 보내기 좋은 딕셔너리로 변환합니다."""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type.value, # Enum 멤버를 문자열 값으로 변환
            "source": self.source,
            "timestamp": self.timestamp,
        }

    @classmethod
    def from_dict(cls, data: dict):
        """딕셔너리로부터 클래스 인스턴스를 생성합니다."""
        # 이 메서드는 실제 구현 시 각 하위 클래스에서 더 구체화해야 합니다.
        return cls(
            event_type=EventType(data.get("event_type")),
            source=data.get("source"),
            timestamp=data.get("timestamp"),
            event_id=data.get("event_id"),
        )


# --- 3. 특정 알림을 위한 구체적인 패킷 구조 ---

@dataclass
class AnomalyDetectionPacket(BasePacket):
    """이상치 감지 알림을 위한 패킷입니다."""
    
    severity: SeverityLevel  # 심각도 (경고, 위험 등)
    anomaly_type: str        # 이상치 종류 (예: 'sensor_drift', 'high_cpu_usage')
    component: str           # 이상치가 발생한 컴포넌트 (예: 'lidar', 'motor_A')
    details: dict            # 구체적인 데이터 (예: {"value": 95.3, "threshold": 90.0})
    
    # 기본값으로 event_type을 고정
    event_type: EventType = field(default=EventType.ANOMALY_DETECTION, init=False)

    def to_dict(self) -> dict:
        """상위 클래스의 to_dict를 확장하여 추가 정보를 포함합니다."""
        base_dict = super().to_dict()
        base_dict.update({
            "severity": self.severity.value,
            "anomaly_type": self.anomaly_type,
            "component": self.component,
            "details": self.details,
        })
        return base_dict

@dataclass
class EmergencyAlertPacket(BasePacket):
    """로봇의 응급 상황 알림을 위한 패킷입니다."""

    code: EmergencyCode    # 응급 상황 코드
    message: str           # 상황에 대한 간단한 설명
    
    # 기본값으로 event_type을 고정
    event_type: EventType = field(default=EventType.EMERGENCY_ALERT, init=False)
    
    def to_dict(self) -> dict:
        """상위 클래스의 to_dict를 확장하여 추가 정보를 포함합니다."""
        base_dict = super().to_dict()
        base_dict.update({
            "code": self.code.value,
            "message": self.message,
        })
        return base_dict