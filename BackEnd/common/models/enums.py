import enum

class SensorTypeEnum(str, enum.Enum):
    DOOR_BEDROOM = "door_bedroom"
    DOOR_BATHROOM = "door_bathroom"
    DOOR_ENTRANCE = "door_entrancedoor_fridge" 
    DOOR_FRIDGE = "door_fridge" 
    PIR_BEDROOM = "pir_bedroom"
    PIR_LIVINGROOM = "pir_livingroom"
    PIR_BATHROOM = "pir_bathroom"
    LIGHT_BEDROOM = "light_bedroom"
    LIGHT_LIVINGROOM = "light_livingroom"
    LIGHT_BATHROOM = "light_bathroom"
    POWER_TV = "power_tv"
    