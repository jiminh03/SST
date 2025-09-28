import os
from dotenv import load_dotenv
from typing import AsyncGenerator
from contextlib import asynccontextmanager

from common.models import *

from sqlmodel import SQLModel, create_engine, inspect
from sqlalchemy.exc import OperationalError
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

import redis.asyncio as redis


class PostgressqlSessionManager:
    def __init__(self, db_user, db_password, db_host, db_port, db_name):
        self.db_user = db_user
        self.db_password = db_password
        self.db_host = db_host
        self.db_port = db_port
        self.db_name = db_name

        self.db_url = f"postgresql+asyncpg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        self.engine = create_async_engine(self.db_url, echo=False)
        self.AsyncSessionMaker = async_sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

    async def create_db_and_tables(self):
        print("데이터베이스 테이블 생성을 시도합니다...")
        try:
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
            async with self.engine.connect() as connection:
                command = text(
                    f"SELECT create_hypertable('{table_name}', '{time_column_name}');"
                )
                await connection.execute(command)
                await connection.commit()
                print(
                    f"'{table_name}' 테이블이 하이퍼테이블로 성공적으로 전환되었습니다."
                )
        except Exception as e:
            if "already a hypertable" in str(e).lower():
                print(f"'{table_name}' 테이블은 이미 하이퍼테이블입니다.")
            else:
                print(f"하이퍼테이블 전환 중 오류 발생: {e}")

    async def clear_all_tables(self, force: bool = False):
        if not force:
            return

        print("\n데이터베이스의 모든 테이블 삭제를 시작합니다...")
        try:
            async with self.engine.connect() as connection:
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
                    await connection.execute(command)
                    await connection.commit()

        except Exception as e:
            print(f"데이터베이스 작업 중 오류가 발생했습니다: {e}")

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        async with self.AsyncSessionMaker() as session:
            yield session

    async def get_session_maker(self) -> AsyncGenerator[AsyncSession, None]:
        return self.AsyncSessionMaker()


class RedisSessionManager:
    def __init__(self, host, port, password):
        self.redis_client = redis.Redis(
            host=host, port=port, password=password, decode_responses=True
        )

    async def get_client(self):
        return self.redis_client

    async def ping(self):
        try:
            await self.redis_client.ping()
            print("Redis에 성공적으로 연결되었습니다.")
            return True
        except redis.exceptions.ConnectionError as e:
            print(f"Redis 연결 실패: {e}")
            return False