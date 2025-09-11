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

# 이 코드는 SQLModel과 SQLAlchemy가 설치되어 있어야 합니다.
# 예시를 위해 SQLModel, SensorLog 클래스가 있다고 가정합니다.
# from models import SensorLog 

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
        self.AsyncSessionMaker = async_sessionmaker(self.engine, class_=AsyncSession, expire_on_commit=False)

    def create_db_and_tables(self):
        """
        SQLModel로 정의된 모든 테이블을 생성
        """
        print("데이터베이스 테이블 생성을 시도합니다...")
        try:
            SQLModel.metadata.create_all(self.engine)
            print("테이블이 성공적으로 생성되었거나 이미 존재합니다.")
            
        except OperationalError as e:
            print(f"데이터베이스 연결에 실패했습니다: {e}")
        except Exception as e:
            print(f"테이블 생성 중 예상치 못한 오류가 발생했습니다: {e}")

    def convert_to_hypertable(self, table_name: str, time_column_name: str):
        """
        지정된 테이블을 TimescaleDB 하이퍼테이블로 전환합니다.

        Args:
            table_name (str): 하이퍼테이블로 만들 테이블의 이름
            time_column_name (str): 파티셔닝의 기준이 될 시간/타임스탬프 컬럼의 이름
        """
        print(f"'{table_name}' 테이블을 하이퍼테이블로 전환합니다...")
        try:
            with self.engine.connect() as connection:
                # SQL 인젝션 방지를 위해 실제 프로덕션 코드에서는 파라미터 바인딩을 권장하지만,
                # 테이블/컬럼 이름은 보통 동적으로 받지 않으므로 여기서는 f-string을 사용합니다.
                command = text(f"SELECT create_hypertable('{table_name}', '{time_column_name}');")
                connection.execute(command)
                connection.commit()
                print(f"✅ '{table_name}' 테이블이 하이퍼테이블로 성공적으로 전환되었습니다.")
        except Exception as e:
            # 이미 하이퍼테이블인 경우 발생하는 특정 오류 메시지를 확인
            if "already a hypertable" in str(e).lower():
                print(f"'{table_name}' 테이블은 이미 하이퍼테이블입니다.")
            else:
                print(f"하이퍼테이블 전환 중 오류 발생: {e}")

    def clear_all_tables(self, force: bool = False):
        """
        데이터베이스의 모든 테이블 내용을 삭제(TRUNCATE)합니다.
        매우 위험한 작업이므로 `force=True` 플래그가 있어야만 실행됩니다.
        
        Args:
            force (bool): True로 설정해야만 실제 삭제 작업을 수행합니다.
        """
        if not force:
            print("\n 경고: 모든 테이블의 데이터를 삭제하는 위험한 작업입니다.")
            print("실행을 원하시면 메서드 호출 시 `force=True` 인자를 전달해주세요.")
            print("예: db_session.clear_all_tables(force=True)")
            return

        print("\n🔥 데이터베이스의 모든 테이블 내용 삭제를 시작합니다...")
        try:
            inspector = inspect(self.engine)
            table_names = inspector.get_table_names()

            if not table_names:
                print("ℹ 데이터베이스에 테이블이 존재하지 않습니다. 작업을 중단합니다.")
                return

            with self.engine.connect() as connection:
                transaction = connection.begin()
                try:
                    # 모든 테이블을 한번에 TRUNCATE 하여 효율성과 안정성을 높입니다.
                    # RESTART IDENTITY는 auto-increment 값을 초기화하고, CASCADE는 외래키 제약을 해결합니다.
                    quoted_tables = ', '.join([f'"{name}"' for name in table_names])
                    sql_command = text(f'TRUNCATE TABLE {quoted_tables} RESTART IDENTITY CASCADE;')
                    
                    print(f"다음 테이블들의 데이터를 삭제합니다: {table_names}")
                    connection.execute(sql_command)
                    transaction.commit()
                    print(" 모든 테이블의 데이터가 성공적으로 삭제되었습니다.")
                except Exception as e:
                    print(f" 데이터 삭제 중 오류가 발생하여 롤백합니다: {e}")
                    transaction.rollback()

        except Exception as e:
            print(f" 데이터베이스 스키마 조회 중 오류가 발생했습니다: {e}")

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """FastAPI 의존성 주입을 위한 비동기 데이터베이스 세션 생성기"""
        async with self.AsyncSessionMaker() as session:
            yield session
