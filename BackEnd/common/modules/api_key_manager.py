import os
from dotenv import load_dotenv
import hashlib
import secrets

from sqlmodel import text
from sqlalchemy.ext.asyncio import AsyncSession

load_dotenv(dotenv_path=".env")
API_KEY_LENGTH = int(os.getenv("API_KEY_LEN"))


class ApiKeyManager:
    """
    API 키 생성 및 검증을 위한 유틸리티 메서드를 제공하는 클래스.
    모든 메서드는 정적 메서드이므로 인스턴스화할 필요가 없습니다.
    """

    @staticmethod
    def generate_api_key() -> tuple[str, str]:
        """새로운 API 키(key)와 해시된 키(hash)를 생성합니다."""
        api_key = ApiKeyManager._generate_random_key()
        api_key_hash = ApiKeyManager.hash_api_key(api_key)
        return api_key, api_key_hash

    @staticmethod
    def verify_api_key(api_key: str, stored_hash: str) -> bool:
        """제공된 API 키가 저장된 해시와 일치하는지 확인합니다."""
        return ApiKeyManager.hash_api_key(api_key) == stored_hash

    @staticmethod
    def _generate_random_key(length: int = API_KEY_LENGTH) -> str:
        """랜덤한 URL-safe 문자열 API 키를 생성합니다."""
        return secrets.token_urlsafe(length)

    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """API 키를 SHA256으로 해시합니다."""
        return hashlib.sha256(api_key.encode()).hexdigest()

class ApiKeyRepository:
    def __init__(self, session: AsyncSession): # DB 세션을 주입받음
        self.session = session

    async def check_key_duplicated(self, hashed_key: str) -> bool:
        """key 중복을 확인하는 메서드"""
        query = text("SELECT COUNT(*) FROM iot_hubs WHERE api_key_hash = :hashed_key")
    
        result = await self.session.execute(query, {"hashed_key": hashed_key})

        count = result.scalar_one()

        return count > 0

    async def get_hash_for_hub(self, hub_id: int) -> str | None:
        query = text("SELECT hub_id, api_key_hash FROM iot_hubs WHERE hub_id = :hub_id")
        result = await self.session.execute(query, {"hub_id": hub_id})
        row = result.fetchone()
        if row:
            return row.api_key_hash
        else:
            return None

    async def save_hash_for_hub(self, hashed_key: str, hub_id: int) -> None:
        """hub_id에 해당하는 허브의 api_key_hash를 업데이트합니다."""
        query = text(
            "UPDATE iot_hubs SET api_key_hash = :api_key_hash WHERE hub_id = :hub_id"
        )
        await self.session.execute(
            query, {"api_key_hash": hashed_key, "hub_id": hub_id}
        )
        # self.session.commit()은 테스트 환경의 fixture에서 관리하므로 여기서는 호출하지 않습니다.

    async def is_correct_key(self, api_key: str, hub_id: int) -> bool:
        """제공된 API 키가 저장된 해시와 일치하는지 확인합니다."""
        stored_hash = await self.get_hash_for_hub(hub_id)
        if not stored_hash:
            return False
        return ApiKeyManager.verify_api_key(api_key, stored_hash)
