from typing import Optional, List
from datetime import datetime
from beanie import Document, Indexed, PydanticObjectId # <--- Thêm PydanticObjectId
from pydantic import Field

class User(Document):
    username: Indexed(str, unique=True)
    email: Indexed(str, unique=True)
    password_hash: str
    full_name: str
    avatar_url: Optional[str] = None
    phone: Optional[str] = None

    # --- THÊM DÒNG NÀY ---
    # Lưu danh sách ID của bạn bè
    friends: List[PydanticObjectId] = []
    # ---------------------

    is_online: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"