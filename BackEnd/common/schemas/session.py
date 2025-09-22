import json
from typing import Optional, Dict, Any
from enum import Enum

# SessionType을 Enum으로 정의합니다.
class SessionType(Enum):
    """세션 타입을 나타내는 열거형"""
    FE = "fe"
    HUB = "hub"

class ConnectionInfo:
    """세션 연결 정보를 담는 클래스"""

    def __init__(self, sid: str, session_type: SessionType, hub_id: Optional[int] = None, staff_id: Optional[int] = None, senior_id: Optional[int] = None):
        """
        ConnectionInfo 객체를 초기화합니다.

        :param sid: 세션 ID
        :param session_type: 세션 타입 (SessionType.FE 또는 SessionType.HUB)
        :param hub_id: 허브 ID (선택 사항)
        :param staff_id: 스태프 ID (선택 사항)
        :param senior_id: 연관 어르신 ID (선택 사항)
        """
        # Enum 타입 힌트로 인해 별도의 유효성 검사가 필요 없습니다.
        self.sid = sid
        self.session_type = session_type
        self.hub_id = hub_id
        self.staff_id = staff_id
        self.senior_id = senior_id

    def to_dict(self) -> Dict[str, Any]:
        """객체를 딕셔너리로 변환합니다."""
        data = {
            "sid": self.sid,
            # JSON 호환성을 위해 enum의 값을 저장합니다.
            "session_type": self.session_type.value
        }
        # None이 아닌 선택적 필드만 딕셔너리에 추가합니다.
        if self.hub_id is not None:
            data["hub_id"] = self.hub_id
        if self.staff_id is not None:
            data["staff_id"] = self.staff_id
        if self.senior_id is not None:
            data["senior_id"] = self.senior_id
        return data

    def to_json(self) -> str:
        """객체를 JSON 문자열로 변환합니다."""
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConnectionInfo':
        """딕셔너리로부터 객체를 생성합니다."""
        return cls(
            sid=data['sid'],
            # 문자열 값을 SessionType enum 멤버로 변환합니다.
            session_type=SessionType(data['session_type']),
            hub_id=data.get('hub_id'),  # 키가 없을 경우 None을 반환
            staff_id=data.get('staff_id'), # 키가 없을 경우 None을 반환
            senior_id=data.get('senior_id') # 키가 없을 경우 None을 반환
        )
