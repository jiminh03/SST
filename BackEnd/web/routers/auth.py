import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from web.schemas.auth_schema import (
    LoginRequest, LoginResponse, StaffRegister, StaffEdit,
    SeniorRegister, SeniorEdit, Hub, ApiKey
)
from web.main import db

from web.services.auth_service import WebAuthModule
from common.modules.user_manager import UserManager, StaffCreate, SeniorCreate, StaffInfo, StaffUpdate, SeniorUpdate
from common.modules.iot_hub_manager import IoTHubManager, HubCreate
from common.modules.api_key_manager import ApiKeyManager, ApiKeyRepository

auth_module = WebAuthModule(
    secret_key=os.getenv("SECRET_KEY"),
    access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")),
    algorithm=os.getenv("ALGORITHM"),
)

# --- FastAPI Router ---
router = APIRouter(tags=["인증"])

# --- Endpoints ---

@router.post("/auth/login", response_model=LoginResponse, summary="직원 로그인 기능", responses={
    401: {"description": "로그인 실패 (ID 또는 비밀번호 불일치)"}
})
async def login_for_access_token(
    form_data: LoginRequest,
    db: AsyncSession = Depends(db.get_session)
):
    """
    직원의 로그인 ID와 비밀번호를 받아 인증을 수행하고, 성공 시 JWT를 발급합니다.
    """
    user_manager = UserManager(db)
    user = await user_manager.get_staff_by_login_id(form_data.login_id)

    if not user or not auth_module.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect login ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth_module.create_access_token(
        data={"sub": user.login_id, "role": user.role}
    )
    return {"access_token": access_token}

@router.post("/staffs", status_code=status.HTTP_201_CREATED, summary="직원 계정 생성", responses={
    400: {"description": "잘못된 요청 형식 (필수 필드 누락 등)"},
    409: {"description": "ID 중복 (이미 존재하는 ID)"}
})
async def register_staff(
    staff_data: StaffRegister,
    db: AsyncSession = Depends(db.get_session)
):
    """
    새로운 직원(복지사)의 계정 정보를 등록합니다.
    """
    user_manager = UserManager(db)
    existing_staff = await user_manager.get_staff_by_login_id(staff_data.login_id)
    if existing_staff:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A staff with this login ID already exists."
        )

    hashed_password = auth_module.get_password_hash(staff_data.password)
    
    new_staff_data = StaffCreate(
        login_id=staff_data.login_id,
        password_hash=hashed_password,
        full_name=staff_data.full_name,
        role=staff_data.role
    )
    
    await user_manager.create_staff(new_staff_data)
    return {"message": "Staff account created successfully."}


@router.put("/staffs", summary="직원 계정 정보 수정", responses={
    400: {"description": "잘못된 요청 형식 (필수 필드 누락 등)"},
    401: {"description": "인증 실패 (토큰 없음 또는 유효하지 않은 토큰)"},
    403: {"description": "권한 없음 (해당 계정 생성 권한 부족)"}
})
async def edit_staff(
    staff_data: StaffEdit,
    db: AsyncSession = Depends(db.get_session),
    current_user: StaffInfo = Depends(auth_module.get_current_user)
):
    """
    특정 직원의 계정 정보(이름, 역할 등)를 수정합니다.
    """
    user_manager = UserManager(db)
    
    update_data = staff_data.model_dump(exclude_unset=True)
    
    if "password" in update_data:
        update_data["password_hash"] = auth_module.get_password_hash(update_data.pop("password"))

    staff_update = StaffUpdate(**update_data)

    try:
        await user_manager.edit_staff(current_user.staff_id, staff_update)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return {"message": "Staff account updated successfully."}


@router.post("/seniors", status_code=status.HTTP_201_CREATED, summary="어르신 등록", responses={
    400: {"description": "잘못된 요청 형식 (필수 필드 누락 등)"},
    409: {"description": "디바이스 ID 중복 (이미 등록된 디바이스)"}
})
async def register_senior(
    senior_data: SeniorRegister,
    db: AsyncSession = Depends(db.get_session),
    current_user: StaffInfo = Depends(auth_module.get_current_user)
):
    """
    새로운 어르신의 기본 정보와 디바이스를 시스템에 등록합니다.
    """
    user_manager = UserManager(db)
    iot_manager = IoTHubManager(db)

    existing_hub = await iot_manager.get_hub_by_unique_id(senior_data.device_id)
    if existing_hub:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Device ID already registered."
        )

    # 1. Create the senior user
    new_senior_info = SeniorCreate(
        full_name=senior_data.name,
        address=senior_data.address
    )
    created_senior = await user_manager.create_senior(new_senior_info)

    # 2. Create and link the IoT Hub
    new_hub_data = HubCreate(
        unique_id=senior_data.device_id,
        senior_id=created_senior.senior_id
    )
    await iot_manager.add_hub(new_hub_data)
    
    return {"message": "Senior and device registered successfully.", "senior_id": created_senior.senior_id}


@router.put("/seniors/{senior_id}", summary="어르신 정보 수정", responses={
    400: {"description": "잘못된 요청 형식 (필수 필드 누락 등)"},
    403: {"description": "권한 없음"}
})
async def edit_senior(
    senior_id: int,
    senior_data: SeniorEdit,
    db: AsyncSession = Depends(db.get_session),
    current_user: StaffInfo = Depends(auth_module.get_current_user)
):
    """
    기존에 등록된 어르신의 상세 정보를 수정합니다.
    """
    user_manager = UserManager(db)
    senior_list = await user_manager.get_care_seniors(current_user.staff_id)

    managed_senior_ids = {senior.senior_id for senior in senior_list}

    # 요청된 senior_id가 담당 목록에 있는지 확인합니다.
    if senior_id not in managed_senior_ids:
        raise HTTPException(
            status_code=403,
            detail="해당 어르신 정보에 접근하거나 수정할 권한이 없습니다."
        )
    
    update_data = senior_data.model_dump(exclude_unset=True)

    senior_update = SeniorUpdate(**update_data)

    try:
        await user_manager.edit_senior(senior_id, senior_update)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return {"message": "Staff account updated successfully."}


@router.post("/hubs", response_model=ApiKey, status_code=status.HTTP_201_CREATED, summary="기기 등록")
async def register_hub(
    hub_data: Hub,
    db: AsyncSession = Depends(db.get_session)
):
    """
    IoT 홈 허브를 시스템에 등록하고 API 키를 발급합니다.
    """
    iot_manager = IoTHubManager(db)
    api_key_repo = ApiKeyRepository(db)

    # 1. Create the hub entry
    new_hub_data = HubCreate(unique_id=hub_data.device_id)
    created_hub = await iot_manager.add_hub(new_hub_data)

    # 2. Generate and store API key
    api_key, hashed_key = ApiKeyManager.generate_api_key()
    
    # Check for the unlikely event of a key collision
    while await api_key_repo.check_key_duplicated(hashed_key):
        api_key, hashed_key = ApiKeyManager.generate_api_key()

    await api_key_repo.update_hash_for_hub(hashed_key, created_hub.hub_id)

    return {"api_key": api_key}


@router.delete("/hubs", status_code=status.HTTP_204_NO_CONTENT, summary="기기 등록 해지")
async def unregister_hub(
    hub_data: Hub,
    db: AsyncSession = Depends(db.get_session)
):
    """
    더 이상 사용하지 않는 홈 허브를 시스템에서 등록 해지합니다.
    NOTE: IoTHubManager does not currently have a 'delete_hub' method.
    """
    # Implementation would require a 'delete_hub_by_unique_id' method in IoTHubManager.
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Functionality not yet implemented.")

