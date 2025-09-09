# common/models/__init__.py
from .user_models import Staff, Senior, StaffSeniorMap
from .iot_models import IoTHub
from .ai_models import AIWeight, EmergencyLog, VisitSchedule

__all__ = [
    "Staff",
    "Senior",
    "StaffSeniorMap",
    "IoTHub",
    "AIWeight",
    "EmergencyLog",
    # "VisitSchedule",
]
