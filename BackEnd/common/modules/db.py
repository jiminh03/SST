from sqlmodel import SQLModel, create_engine
from sqlalchemy.exc import OperationalError
import os
from dotenv import load_dotenv

# --- 여기에 이전에 작성한 모든 SQLModel 클래스를 붙여넣으세요 ---
# 예: Staff, Senior, StaffSeniorMap, IoTHub, AIWeight, 
#     EmergencyLog, VisitSchedule, SensorLog 등
# from .models import * # 별도 파일로 관리하는 경우
from common.models import *

# --- 1. 데이터베이스 연결 설정 ---
# 환경 변수나 설정 파일에서 불러오는 것을 권장합니다.
load_dotenv()

DB_USER = os.getenv("DB_ROOT_USER", "postgres")
DB_PASSWORD = os.getenv("DB_ROOT_PW", "your_password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "smart_care_db")

# PostgreSQL 연결을 위한 DATABASE_URL 생성
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 데이터베이스 엔진 생성
# echo=True 설정 시 실행되는 SQL 쿼리를 터미널에서 볼 수 있습니다.
engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables():
    """
    SQLModel로 정의된 모든 테이블을 데이터베이스에 생성합니다.
    이미 테이블이 존재하면 생성하지 않습니다.
    """
    print("데이터베이스 테이블 생성을 시도합니다...")
    try:
        SQLModel.metadata.create_all(engine)
        print("✅ 테이블이 성공적으로 생성되었거나 이미 존재합니다.")
        
        # (선택 사항) TimescaleDB 하이퍼테이블 전환 명령어 실행
        # 이 작업은 테이블 생성 후 딱 한 번만 실행하면 됩니다.
        # with engine.connect() as connection:
        #     from sqlalchemy import text
        #     try:
        #         print("SensorLog 테이블을 하이퍼테이블로 전환합니다...")
        #         connection.execute(text("SELECT create_hypertable('sensor_logs', 'timestamp');"))
        #         connection.commit() # 변경사항 커밋
        #         print("✅ SensorLog 테이블이 하이퍼테이블로 성공적으로 전환되었습니다.")
        #     except Exception as e:
        #         # 이미 하이퍼테이블인 경우 오류가 발생할 수 있습니다.
        #         if "already a hypertable" in str(e):
        #             print("ℹ️ SensorLog 테이블은 이미 하이퍼테이블입니다.")
        #         else:
        #             print(f"⚠️ 하이퍼테이블 전환 중 오류 발생: {e}")


    except OperationalError as e:
        print("❌ 데이터베이스 연결에 실패했습니다. 연결 정보를 확인해주세요.")
        print(f"   오류 상세: {e}")
    except Exception as e:
        print(f"❌ 테이블 생성 중 예상치 못한 오류가 발생했습니다: {e}")

# --- 이 스크립트를 직접 실행할 때 함수가 호출됩니다 ---
if __name__ == "__main__":
    # 실행 전, PostgreSQL 드라이버가 설치되어 있는지 확인하세요.
    # pip install psycopg2-binary
    create_db_and_tables()