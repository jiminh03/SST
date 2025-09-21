import json
from typing import Dict, Any


class WebRTCRobotOffer:
    """로봇이 생성한 WebRTC Offer 정보를 담는 클래스"""

    def __init__(self, api_key: str, offer_sdp: Dict[str, Any]):
        self.api_key = api_key
        self.offer_sdp = offer_sdp

    def to_dict(self) -> Dict[str, Any]:
        """객체를 딕셔너리로 변환합니다."""
        return {"api_key": self.api_key, "offer_sdp": self.offer_sdp}

    def to_json(self) -> str:
        """객체를 JSON 문자열로 변환합니다."""
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WebRTCRobotOffer":
        """딕셔너리로부터 객체를 생성합니다."""
        return cls(api_key=data["api_key"], offer_sdp=data["offer_sdp"])


class WebRTCRobotAnswer:
    """로봇이 생성한 WebRTC Answer 정보를 담는 클래스"""

    def __init__(self, api_key: str, answer_sdp: Dict[str, Any]):
        self.api_key = api_key
        self.answer_sdp = answer_sdp

    def to_dict(self) -> Dict[str, Any]:
        """객체를 딕셔너리로 변환합니다."""
        return {"api_key": self.api_key, "answer_sdp": self.answer_sdp}

    def to_json(self) -> str:
        """객체를 JSON 문자열로 변환합니다."""
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WebRTCRobotAnswer":
        """딕셔너리로부터 객체를 생성합니다."""
        return cls(api_key=data["api_key"], answer_sdp=data["answer_sdp"])


class WebRTCFEOffer:
    """프론트엔드(수신자)에서 생성한 WebRTC Offer 정보를 담는 클래스"""

    def __init__(self, senior_id: int, offer_sdp: Dict[str, Any]):
        self.senior_id = senior_id
        self.offer_sdp = offer_sdp

    def to_dict(self) -> Dict[str, Any]:
        """객체를 딕셔너리로 변환합니다."""
        return {
            "senior_id": self.senior_id,  # senior_id 추가
            "offer_sdp": self.offer_sdp,
        }

    def to_json(self) -> str:
        """객체를 JSON 문자열로 변환합니다."""
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WebRTCFEOffer":
        """딕셔너리로부터 객체를 생성합니다."""
        return cls(
            senior_id=data["senior_id"], offer_sdp=data["offer_sdp"]  # senior_id 추가
        )


class WebRTCFEAnswer:
    """프론트엔드(수신자)에서 생성한 WebRTC Answer 정보를 담는 클래스"""

    def __init__(self, senior_id: int, answer_sdp: str):
        self.senior_id = senior_id  # senior_id 필드 추가
        self.answer_sdp = answer_sdp

    def to_dict(self) -> Dict[str, Any]:
        """객체를 딕셔너리로 변환합니다."""
        return {
            "senior_id": self.senior_id,  # senior_id 추가
            "answer_sdp": self.answer_sdp,
        }

    def to_json(self) -> str:
        """객체를 JSON 문자열로 변환합니다."""
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WebRTCFEAnswer":
        """딕셔너리로부터 객체를 생성합니다."""
        return cls(
            senior_id=data["senior_id"], answer_sdp=data["answer_sdp"]  # senior_id 추가
        )
