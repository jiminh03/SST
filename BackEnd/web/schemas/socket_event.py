from enum import Enum

class ConnectEvents(str, Enum):
    """소켓 통신에서 사용되는 이벤트 이름 목록"""
    
    # 서버 -> 클라이언트
    REQUEST_AUTH = 'request_auth'
    AUTH_SUCCESS = 'auth_success'
    
    # 클라이언트 -> 서버
    CONNECT = 'connect'
    DISCONNECT = 'disconnect'
    AUTHENTICATE = 'authenticate'

class WebRTCEvents(str, Enum):
    """WebRTC 시그널링을 위한 소켓 이벤트 이름 목록"""

    # 클라이언트 -> 서버 (Client to Server)
    REGISTER_OFFER = 'client:register_offer'      # 로봇이 서버로 Offer를 등록
    SEND_ANSWER = 'client:send_answer'          # FE가 서버로 Answer를 전송
    CHECK_OFFER = 'client:check_offer' #이미 등록된 offer 확인
    CHECK_ANSWER = 'client:check_answer' #이미 등록된 answer 확인
    SEND_ICE_CANDIDATE = 'client:send_ice_candidate' # 로봇 또는 FE가 ICE Candidate를 서버로 전송

    # 서버 -> 클라이언트 (Server to Client)
    NEW_OFFER = 'server:new_offer'              # 서버가 FE에게 새로운 Offer를 전달
    NEW_ANSWER = 'server:new_answer'            # 서버가 로봇에게 새로운 Answer를 전달
    NEW_ICE_CANDIDATE = 'server:new_ice_candidate' # 서버가 로봇 또는 FE에게 ICE Candidate를 전달

class AlarmEvents(str, Enum):
    """알람 관련 소켓 이벤트 이름 목록"""

    # 서버 -> 클라이언트 이벤트
    REQUEST_SAFETY_CHECK = "server:request_safety_check"  # 서버 -> Hub: 안전 확인 요청
    EMERGENCY_SITUATION = "server:emergency_situation"     # 서버 -> FE: 응급 상황 전파
    SENIOR_IS_SAFE = "server:senior_is_safe"               # 서버 -> FE: 안전 상태 전파
    SAFETY_CHECK_FAILED = "server:safety_check_failed"     # 서버 -> FE: 안전 확인 실패 전파 (추가됨)
    NOTIFY_SENSOR_EVENT = "server:notify_sensor_event"     # 서버 -> FE: 센서 이벤트 전파 (추가됨)"

    # 클라이언트 -> 서버 이벤트
    ACK_SAFETY_CHECK = "hub:ack_safety_check"              # Hub -> 서버: 안전 확인 요청 수신 응답 (추가됨)
    REPORT_SENIOR_IS_SAFE = "hub:report_senior_is_safe"    # Hub -> 서버: 안전 확인 결과 보고 (안전)
    REPORT_EMERGENCY = "hub:report_emergency"              # Hub -> 서버: 안전 확인 결과 보고 (응급)
    REPORT_CHECK_FAILED = "hub:report_check_failed"        # Hub -> 서버: 안전 확인 실패 보고

class NotifyEvents(str, Enum):
    """프론트엔드-백엔드 간 소켓 통신 이벤트 목록"""

    # --- 센서 로그 이벤트 (Sensor Log Events) ---
    # 1. 서버 -> FE: 센서 변경에 따른 실시간 로그 전송 또는 FE 요청에 대한 응답
    SERVER_SEND_SENSOR_LOG = "server:send_sensor_log"
    
    # 2. FE -> 서버: 특정 시점의 센서 로그 조회 요청
    CLIENT_REQUEST_SENSOR_LOG = "client:request_sensor_log"
    
    # --- 상태 전송 이벤트 (Status Transmission Events) ---
    # 3. 서버 -> FE: 어르신 상태 변경 실시간 알림
    SERVER_NOTIFY_SENIOR_STATUS_CHANGE = "server:notify_senior_status_change"

    # 4. FE -> 서버: 페이지 첫 진입 시 전체 상태 데이터 요청
    CLIENT_REQUEST_INITIAL_STATUS = "client:request_initial_status"

    # 5. 서버 -> FE: FE의 요청에 대한 전체 초기 상태 데이터 전송
    SERVER_SEND_INITIAL_STATUS = "server:send_initial_status"