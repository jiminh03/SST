class ApiKeyManager:
    def __init__(self):
        # 실제 환경에서는 데이터베이스나 안전한 저장소에서 API 키를 관리해야 합니다.
        # 여기서는 간단한 예시를 위해 메모리에 저장합니다.
        self.api_keys = {}  # {hub_id: api_key_hash}

    def generate_api_key(self, hub_id: int) -> str:
        """새로운 API 키를 생성하고 해시하여 저장합니다."""
        api_key = self._generate_random_key()
        api_key_hash = self._hash_api_key(api_key)
        self.api_keys[hub_id] = api_key_hash
        return api_key

    def verify_api_key(self, hub_id: int, api_key: str) -> bool:
        """제공된 API 키가 유효한지 확인합니다."""
        if hub_id not in self.api_keys:
            return False
        stored_hash = self.api_keys[hub_id]
        return self._hash_api_key(api_key) == stored_hash

    def _generate_random_key(self, length: int = 32) -> str:
        """랜덤한 문자열 API 키를 생성합니다."""
        import secrets
        return secrets.token_urlsafe(length)

    def _hash_api_key(self, api_key: str) -> str:
        """API 키를 해시합니다."""
        import hashlib
        return hashlib.sha256(api_key.encode()).hexdigest()

# 사용 예시 (선택 사항)
if __name__ == "__main__":
    key_manager = ApiKeyManager()

    hub_id_1 = 1
    new_key_1 = key_manager.generate_api_key(hub_id_1)
    print(f"Hub {hub_id_1}을 위한 새 API 키: {new_key_1}")

    hub_id_2 = 2
    new_key_2 = key_manager.generate_api_key(hub_id_2)
    print(f"Hub {hub_id_2}을 위한 새 API 키: {new_key_2}")