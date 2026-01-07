from pydantic import BaseModel, EmailStr, Field, BeforeValidator
from datetime import date, datetime
from typing import Optional, Annotated

# --- 1. Helper xử lý ObjectId cho Pydantic v2 ---
# Chuyển đổi ObjectId sang string tự động
PyObjectId = Annotated[str, BeforeValidator(str)]

# --- 2. Schema Đăng ký (Client -> Server) ---
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    dob: Optional[date] = None

# --- 3. Schema Trả về thông tin User (Server -> Client) ---
class UserResponse(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    username: str
    email: str
    full_name: str
    created_at: datetime
    avatar_url: Optional[str] = None # Thêm trường này nếu model User có

    class Config:
        from_attributes = True
        populate_by_name = True

# --- 4. Schema Đăng nhập (Client -> Server) ---
class LoginRequest(BaseModel):
    username: str
    password: str

# --- 5. Schema Token (Server -> Client) ---
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user_id: str
    username: str