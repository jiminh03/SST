# common/models/__init__.py

# AI Models
from .ai_models import AIWeight

# IoT Models
from .iot_models import IoTHub, SensorLog

# User Models
from .user_models import Staff, Senior, StaffSeniorMap

# Web Util Models
from .web_util_model import EmergencyLog, VisitSchedule

# NOTE: The ...Create, ...Read, ...Update schemas requested in the prompt
# were not found in the existing model files. Only base models are imported
# and rebuilt here. If those schemas exist in other files, they should be
# imported as well.

# Rebuild all table models to establish relationships.
print("--- Rebuilding all SQLModel models... ---")

AIWeight.model_rebuild()

IoTHub.model_rebuild()
SensorLog.model_rebuild()

Staff.model_rebuild()
Senior.model_rebuild()
StaffSeniorMap.model_rebuild()

EmergencyLog.model_rebuild()
VisitSchedule.model_rebuild()

print("--- All model files initialized and rebuilt successfully. ---")