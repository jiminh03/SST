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