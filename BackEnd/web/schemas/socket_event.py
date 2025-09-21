from enum import Enum

class SocketEvents(str, Enum):
    """소켓 통신에서 사용되는 이벤트 이름 목록"""
    
    # 서버 -> 클라이언트
    REQUEST_AUTH = 'request_auth'
    AUTH_SUCCESS = 'auth_success'
    
    # 클라이언트 -> 서버
    CONNECT = 'connect'
    DISCONNECT = 'disconnect'
    AUTHENTICATE = 'authenticate'