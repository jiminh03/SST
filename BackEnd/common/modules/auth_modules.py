import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext


class WebAuthModule:
    def __init__(
        self,
        secret_key: str,
        access_token_expire_minutes: int,
        algorithm: str = "HS256",
    ):
        self._secret_key = secret_key
        self._access_token_expire_minutes = access_token_expire_minutes
        self._algorithm = algorithm

        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def get_password_hash(self, password: str) -> str:
        """
        평문 비밀번호를 bcrypt 해시로 변환합니다.

        Args:
            password (str): 해시할 평문 비밀번호입니다.

        Returns:
            str: 해시 처리된 비밀번호 문자열입니다.
        """
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        평문 비밀번호가 해시된 비밀번호와 일치하는지 확인합니다.

        Args:
            plain_password (str): 확인할 평문 비밀번호입니다.
            hashed_password (str): 비교할 해시된 비밀번호입니다.

        Returns:
            bool: 비밀번호가 일치하면 True, 그렇지 않으면 False를 반환합니다.
        """
        return self.pwd_context.verify(plain_password, hashed_password)

    def create_access_token(
        self, data: dict, expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        주어진 데이터를 기반으로 JWT 액세스 토큰을 생성합니다.

        Args:
            data (dict): 토큰의 페이로드(payload)에 포함될 데이터입니다.
            expires_delta (Optional[timedelta]): 토큰의 만료 시간을 지정합니다.
                설정하지 않으면 인스턴스 생성 시 지정된 기본 만료 시간이 적용됩니다.

        Returns:
            str: 생성된 JWT 액세스 토큰 문자열입니다.
        """
        to_encode = data.copy()
        now = datetime.now(timezone.utc)

        if expires_delta:
            expire = now + expires_delta
        else:
            expire = now + timedelta(minutes=self._access_token_expire_minutes)

        to_encode.update({"exp": expire, "iat": now})
        return jwt.encode(to_encode, self._secret_key, algorithm=self._algorithm)

    def decode_jwt_payload(self, token: str) -> dict:
        """
        JWT 토큰을 검증하고 디코딩하여 페이로드(payload)를 반환합니다.

        Args:
            token (str): 디코딩할 JWT 토큰 문자열입니다.

        Raises:
            ValueError: 토큰의 서명이 유효하지 않거나, 형식이 잘못되었거나,
                        만료되는 등 디코딩에 실패할 경우 발생합니다.

        Returns:
            dict: 디코딩된 토큰의 페이로드(payload)입니다.
        """
        try:
            payload = jwt.decode(
                token, self._secret_key, algorithms=[self._algorithm]
            )
            return payload
        except JWTError as e:
            raise ValueError(f"토큰 디코딩에 실패했습니다: {e}") from e