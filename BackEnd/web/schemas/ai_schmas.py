from pydantic import BaseModel
from enum import Enum

# 1. 'risk_level'에 들어갈 수 있는 값들을 Enum으로 정의합니다.
class RiskLevelEnum(str, Enum):
    """위험도 수준을 정의하는 열거형"""
    SAFE = "안전"
    CAUTION = "주의"
    DANGER = "위험"
    UNKNOWN = "알수없음"

# 2. JSON 구조에 맞는 Pydantic 모델(패킷)을 정의합니다.
class RiskAssessmentPacket(BaseModel):
    """위험도 평가 결과를 담는 데이터 패킷 스키마"""
    risk_level: RiskLevelEnum
    reason: str