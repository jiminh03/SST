import pytest
import os
from dotenv import load_dotenv
from sqlmodel import Session

# 프로젝트 구조에 맞게 db_manager.py의 경로를 수정해주세요.
# 예: from src.database.db_manager import PostgressqlSessionManager
from common.modules.db_manager import PostgressqlSessionManager 

# --- Fixture 설정 ---

@pytest.fixture(scope="session")
def db_manager():
    """
    [세션 스코프] 전체 테스트 세션 동안 단 한 번만 실행됩니다.
    1. 테스트용 데이터베이스 설정을 .env 파일에서 로드합니다.
    2. PostgressqlSessionManager 인스턴스를 생성합니다.
    3. 모든 SQLModel 테이블을 테스트 데이터베이스에 생성합니다.
    4. 생성된 매니저 객체를 다른 fixture에 제공합니다.
    """
    print("\n--- 🛠️  Setting up test database session ---")
    
    # .env 파일에서 테스트용 DB 접속 정보 로드
    # 프로젝트 루트에 .env.test 파일이 있다고 가정합니다.
    load_dotenv(dotenv_path=".env.test")

    manager = PostgressqlSessionManager(
        db_user=os.getenv("TEST_DB_USER"),
        db_password=os.getenv("TEST_DB_PASSWORD"),
        db_host=os.getenv("TEST_DB_HOST"),
        db_port=os.getenv("TEST_DB_PORT"),
        db_name=os.getenv("TEST_DB_NAME"),
    )

    # 테스트 세션 시작 시 한 번만 모든 테이블을 생성합니다.
    manager.create_db_and_tables()
    
    # TimescaleDB를 사용하는 경우 하이퍼테이블 전환 (필요 시 주석 해제)
    # manager.convert_to_hypertable("sensor_logs", "timestamp")

    yield manager # 테스트 세션 동안 manager 객체를 유지합니다.

    print("\n---  teardown test database session ---")
    # (선택 사항) 모든 테스트가 끝난 후 데이터베이스의 모든 테이블을 삭제할 수 있습니다.
    # 하지만 보통 테스트 DB는 그대로 두거나 컨테이너를 내리는 경우가 많습니다.
    # print("Clearing all tables after test session...")
    # manager.clear_all_tables(force=True)


@pytest.fixture(scope="function")
def db_session_manager(db_manager: PostgressqlSessionManager):
    """
    [함수 스코프] 각 테스트 함수가 실행될 때마다 실행됩니다.
    1. 세션 스코프의 db_manager fixture를 주입받습니다.
    2. 각 테스트가 독립적으로 실행되도록, 테스트 시작 전 모든 테이블을 초기화합니다.
    3. 테스트 함수에 깨끗한 상태의 manager 객체를 제공합니다.
    """
    # 각 테스트 함수 실행 전에 모든 테이블의 데이터를 삭제하여 격리 환경을 보장합니다.
    db_manager.clear_all_tables(force=True)
    yield db_manager


