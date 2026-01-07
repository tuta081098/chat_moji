from fastapi import APIRouter, HTTPException, status
from models.users import User
from schemas.users import UserCreate, UserResponse, LoginRequest, TokenResponse
from core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from beanie.operators import Or
from typing import List

router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register_user(user_input: UserCreate):
    user_exists = await User.find_one(
        Or(
            User.username == user_input.username,
            User.email == user_input.email
        )
    )

    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username hoặc Email đã được sử dụng."
        )

    hashed_password = get_password_hash(user_input.password)

    new_user = User(
        username=user_input.username,
        email=user_input.email,
        password_hash=hashed_password,
        full_name=user_input.full_name,
        phone=user_input.phone,
    )

    await new_user.create()

    return UserResponse(
        id=str(new_user.id),
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        created_at=new_user.created_at
    )

@router.post("/login", response_model=TokenResponse)
async def login_for_access_token(form_data: LoginRequest):
    # 1. Tìm user trong DB
    user = await User.find_one(User.username == form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai tên đăng nhập hoặc mật khẩu",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Tạo Token
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})

    # 3. Trả về đúng cấu trúc TokenResponse
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",    # <--- Bạn đang thiếu dòng này
        "user_id": str(user.id),   # <--- Và dòng này
        "username": user.username
    }

@router.get("/users", response_model=List[UserResponse], response_model_by_alias=False)
async def get_all_users():
    # Lấy tất cả user trong DB
    users = await User.find_all().to_list()
    return users