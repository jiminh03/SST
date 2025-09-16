import os

import common.modules.db_manager as db_manager

db = db_manager.PostgressqlSessionManager(
    db_user=os.getenv("DB_ROOT_USER"),
    db_password=os.getenv("DB_ROOT_PW"),
    db_host=os.getenv("DB_HOST"),
    db_port=os.getenv("POSTGRES_PORT"),
    db_name=os.getenv("DB_NAME"),
)