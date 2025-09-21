import os
from dotenv import load_dotenv
import hashlib
import secrets

from sqlmodel import text
from sqlalchemy.ext.asyncio import AsyncSession

from .iot_hub_manager import HubUpdate, IotHubManager, HubBasicInfo

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
        self.iot_hub_manager = IotHubManager(session)

    async def check_key_duplicated(self, hashed_key: str) -> bool:
        """key 중복을 확인하는 메서드"""
        query = text("SELECT COUNT(*) FROM iot_hubs WHERE api_key_hash = :hashed_key")
    
        result = await self.session.execute(query, {"hashed_key": hashed_key})

        count = result.scalar_one()

        return count > 0

    async def get_hash_for_hub(self, hub_id: int) -> str | None:
        """IoTHubManager를 통해 허브 정보를 가져와 해시를 반환합니다."""
        hub_info = await self.iot_hub_manager.get_hub_info(hub_id)
        if not hub_info:
            raise ValueError(f"get_hash_for_hub - invalid hub_id:{hub_id}")
        return hub_info.api_key_hash

    async def update_hash_for_hub(self, hashed_key: str, hub_id: int) -> None:
        """IoTHubManager를 통해 허브의 api_key_hash를 업데이트합니다."""
        await self.iot_hub_manager.edit_hub_info(hub_id=hub_id, update_data=HubUpdate(api_key_hash=hashed_key))

    async def get_hub_by_api_key(self, api_key: str) -> HubBasicInfo | None:
        """api 키를 통해 hub정보를 가져옵니다."""
        hashed_key = ApiKeyManager.hash_api_key(api_key)
        return await self.iot_hub_manager.get_hub_by_api_key_hash(hashed_key)

    async def is_correct_key(self, api_key: str, hub_id: int) -> bool:
        """제공된 API 키가 저장된 해시와 일치하는지 확인합니다."""
        stored_hash = await self.get_hash_for_hub(hub_id)
        if not stored_hash:
            raise ValueError(f"is_correct_key - invalid hub_id:{hub_id}")
        return ApiKeyManager.verify_api_key(api_key, stored_hash)