import pytest
from sqlalchemy.ext.asyncio import AsyncSession
# 실제 프로젝트 구조에 맞게 경로를 수정해주세요.
from common.modules.api_key_manager import ApiKeyManager, ApiKeyRepository
from fastapi import Depends

# conftest.py의 db_session fixture가 자동으로 주입됩니다.

# --- API 키 생성 및 중복 확인 테스트 ---

@pytest.mark.asyncio
async def test_add_api_key_and_check_duplication(get_session: AsyncSession):
    """
    새로운 API 키를 생성 및 추가한 후, 중복 검사가 정상적으로 동작하는지 테스트합니다.
    """
    # Arrange (준비)
    db_session: AsyncSession = get_session
    key_manager = ApiKeyManager()
    key_repo = ApiKeyRepository(db_session)
    hub_id = 13
    new_api_key, new_hashed_key = key_manager.generate_api_key()

    # Act & Assert (실행 및 검증) - 1: 추가 전에는 중복이 아니어야 함
    is_duplicated_before = await key_repo.check_key_duplicated(new_api_key)
    assert not is_duplicated_before

    # Act & Assert (실행 및 검증) - 2: 키를 추가하고, 추가 후에는 중복으로 확인되어야 함
    await key_repo.save_hash_for_hub(new_hashed_key, hub_id)
    is_duplicated_after = await key_repo.check_key_duplicated(new_api_key)
    assert is_duplicated_after


# --- API 키 검증 로직 테스트 (3개의 시나리오로 분리) ---

@pytest.mark.asyncio
async def test_verify_succeeds_with_correct_key_and_hub_id(get_session: AsyncSession):
    """
    올바른 API 키와 허브 ID로 검증 시 성공하는지 테스트합니다. (성공 케이스)
    """
    # Arrange (준비)
    db_session: AsyncSession = get_session
    key_manager = ApiKeyManager()
    key_repo = ApiKeyRepository(db_session)
    hub_id = 13
    api_key, hashed_key = key_manager.generate_api_key()
    await key_repo.save_hash_for_hub(hashed_key, hub_id)

    # Act (실행)
    is_correct = await key_repo.is_correct_key(api_key, hub_id)

    # Assert (검증)
    assert is_correct is True


@pytest.mark.asyncio
async def test_verify_fails_with_wrong_hub_id(get_session: AsyncSession):
    """
    API 키는 올바르지만 허브 ID가 틀릴 경우 검증에 실패하는지 테스트합니다. (실패 케이스 1)
    """
    # Arrange (준비)
    db_session: AsyncSession = get_session
    key_manager = ApiKeyManager()
    key_repo = ApiKeyRepository(db_session)
    correct_hub_id = 13
    wrong_hub_id = 14
    new_api_key, new_hashed_key = key_manager.generate_api_key()
    await key_repo.save_hash_for_hub(new_hashed_key, correct_hub_id)

    # Act (실행)
    hashed_key = ApiKeyManager.hash_api_key(new_api_key)
    is_correct = await key_repo.is_correct_key(hashed_key, wrong_hub_id)

    # Assert (검증)
    assert is_correct is False


@pytest.mark.asyncio
async def test_verify_fails_with_wrong_api_key(get_session: AsyncSession):
    """
    허브 ID는 올바르지만 API 키가 틀릴 경우 검증에 실패하는지 테스트합니다. (실패 케이스 2)
    """
    # Arrange (준비)
    db_session: AsyncSession = get_session
    key_manager = ApiKeyManager()
    key_repo = ApiKeyRepository(db_session)
    hub_id = 13
    correct_api_key = key_manager.generate_api_key()
    wrong_api_key = "this-is-a-wrong-api-key"
    wrong_hashed_key = ApiKeyManager.hash_api_key(wrong_api_key)
    await key_repo.save_hash_for_hub(correct_api_key, hub_id)
    # Act (실행)
    is_correct = await key_repo.is_correct_key(wrong_hashed_key, hub_id)

    # Assert (검증)
    assert is_correct is False