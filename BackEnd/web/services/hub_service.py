import os
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from common.modules.api_key_manager import ApiKeyRepository
from common.modules.user_manager import UserManager
from web.database import db

class HubService:
    def __init__(self, api_key_repo: ApiKeyRepository):
        self.api_key_repo = api_key_repo


    async def get_hub_from_api_key(self, api_key): 
        hub = await self.api_key_repo.get_hub_by_api_key(api_key)

        if not hub:
            return None
        return hub