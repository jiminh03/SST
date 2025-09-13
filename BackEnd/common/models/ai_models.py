# common/models/extra_models.py
from datetime import datetime, timezone
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class AIWeight(SQLModel, table=True):
    """개인화된 AI 모델 가중치 정보와 경로를 저장하는 테이블"""
    __tablename__ = "ai_weights"

    weight_id: Optional[int] = Field(default=None, primary_key=True)
    version: int = Field(description="가중치 버전")
    storage_path: str = Field(description="가중치 파일 경로 (Object Storage)")
    is_active: bool = Field(default=False, description="현재 서비스에 사용 중인 버전인지 여부")
    created_at: datetime = Field(
        default_factory=datetime.utcnow, nullable=False
    )

    # 어느 어르신의 가중치인지 명시 (일대다 관계)
    senior_id: int = Field(foreign_key="seniors.senior_id")
    senior: "Senior" = Relationship(back_populates="ai_weights")

