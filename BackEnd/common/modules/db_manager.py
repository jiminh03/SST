from sqlmodel import SQLModel, create_engine, inspect
from sqlalchemy.exc import OperationalError
import os
from dotenv import load_dotenv
from typing import AsyncGenerator

# --- 여기에 이전에 작성한 모든 SQLModel 클래스를 붙여넣으세요 ---
# 예: Staff, Senior, StaffSeniorMap, IoTHub, AIWeight,
#     EmergencyLog, VisitSchedule, SensorLog 등
# from .models import * # 별도 파일로 관리하는 경우
from common.models import *


from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

class PostgressqlSessionManager:
    """데이터베이스 세션 생성 및 제공 클래스"""

    def __init__(self, db_user, db_password, db_host, db_port, db_name):
        self.db_user = db_user
        self.db_password = db_password
        self.db_host = db_host
        self.db_port = db_port
        self.db_name = db_name

        self.db_url = f"postgresql+asyncpg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        self.engine = create_async_engine(self.db_url, echo=False)
        # SessionMaker를 모듈 레벨에서 한 번만 생성합니다.
        self.AsyncSessionMaker = async_sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

    async def create_db_and_tables(self):
        """
        SQLModel로 정의된 모든 테이블을 생성
        """
        print("데이터베이스 테이블 생성을 시도합니다...")
        try:
            """SQLModel 메타데이터를 기반으로 모든 테이블을 비동기적으로 생성합니다."""
            async with self.engine.begin() as conn:
                await conn.run_sync(SQLModel.metadata.create_all)
                await conn.commit()
                print("--- Database tables created successfully. ---")

        except OperationalError as e:
            print(f"데이터베이스 연결에 실패했습니다: {e}")
        except Exception as e:
            print(f"테이블 생성 중 예상치 못한 오류가 발생했습니다: {e}")

    async def convert_to_hypertable(self, table_name: str, time_column_name: str):
        print(f"'{table_name}' 테이블을 하이퍼테이블로 전환합니다...")
        try:
            # 'async with'를 사용하여 비동기 커넥션을 얻습니다.
            async with self.engine.connect() as connection:
                command = text(
                    f"SELECT create_hypertable('{table_name}', '{time_column_name}');"
                )
                # execute와 commit도 모두 await로 호출해야 합니다.
                await connection.execute(command)
                await connection.commit()
                print(
                    f"✅ '{table_name}' 테이블이 하이퍼테이블로 성공적으로 전환되었습니다."
                )
        except Exception as e:
            if "already a hypertable" in str(e).lower():
                print(f"'{table_name}' 테이블은 이미 하이퍼테이블입니다.")
            else:
                print(f"하이퍼테이블 전환 중 오류 발생: {e}")

    async def clear_all_tables(self, force: bool = False):
        """
        데이터베이스의 모든 테이블을 삭제(DROP)합니다.
        데이터뿐만 아니라 테이블 구조 자체가 사라지는 매우 위험한 작업입니다.
        `force=True` 플래그가 있어야만 실행됩니다.

        Args:
            force (bool): True로 설정해야만 실제 삭제 작업을 수행합니다.
        """
        if not force:
            return

        print("\n🔥 데이터베이스의 모든 테이블 삭제를 시작합니다...")
        try:
            async with self.engine.connect() as connection:
                # 'async with'를 사용하여 비동기 커넥션을 얻습니다.
                async with self.engine.connect() as connection:
                    drop_all_tables_query = """
                    DO $$
                    DECLARE
                        r RECORD;
                    BEGIN
                        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                        END LOOP;
                    END $$;
                    """
                    command = text(drop_all_tables_query)
                    # execute와 commit도 모두 await로 호출해야 합니다.
                    await connection.execute(command)
                    await connection.commit()

        except Exception as e:
            print(f"데이터베이스 작업 중 오류가 발생했습니다: {e}")

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """FastAPI 의존성 주입을 위한 비동기 데이터베이스 세션 생성기"""
        async with self.AsyncSessionMaker() as session:
            yield session
