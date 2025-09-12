import datetime
from typing import List, Optional
from deprecated import deprecated

from sqlmodel import Field, Relationship, SQLModel

class EmergencyLog(SQLModel, table=True):
    """응급 상황 발생 이력을 저장하는 테이블"""
    __tablename__ = "emergency_logs"

    log_id: Optional[int] = Field(default=None, primary_key=True)
    event_type: str = Field(description="이벤트 종류 (e.g., fall_detection, no_response)")
    description: Optional[str] = Field(default=None, description="상세 내용")
    occurred_at: datetime.datetime = Field(description="발생 시각")
    resolved_at: Optional[datetime.datetime] = Field(default=None, description="조치 완료 시각")

    # 어느 어르신의 로그인지 명시 (일대다 관계)
    senior_id: int = Field(foreign_key="seniors.senior_id")
    senior: "Senior" = Relationship(back_populates="emergency_logs")

@deprecated(version='1.0.0', reason="excluded from MVP")
class VisitSchedule(SQLModel, table=True):
    """직원의 어르신 방문 일정 및 결과 보고를 저장하는 테이블"""
    __tablename__ = "visit_schedules"

    visit_id: Optional[int] = Field(default=None, primary_key=True)
    visit_datetime: datetime.datetime = Field(description="방문 예정 일시")
    status: str = Field(default="scheduled", description="상태 (e.g., scheduled, completed, cancelled)")
    report: Optional[str] = Field(default=None, description="방문 결과 보고 내용")
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow, nullable=False
    )

    # # 어느 직원-어르신 관계에 대한 방문 일정인지 명시
    # staff_senior_map: "StaffSeniorMap" = Relationship(back_populates="visit_schedules")
