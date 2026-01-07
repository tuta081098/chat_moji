from typing import List, Optional
from datetime import datetime, timedelta
from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field

def vietnam_now():
    return datetime.utcnow() + timedelta(hours=7)

# Model phụ để nhúng (Embedded) vào Conversation
class LastMessagePreview(BaseModel):
    content: str
    sender_id: PydanticObjectId
    created_at: datetime
    is_read: bool = False

class Conversation(Document):
    type: str = "DIRECT" # hoặc "GROUP"
    members: List[PydanticObjectId] # Danh sách ID các user tham gia
    group_name: Optional[str] = None
    last_message: Optional[LastMessagePreview] = None # Cache tin cuối để hiển thị nhanh
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "conversations"

class Message(Document):
    conversation_id: PydanticObjectId
    sender_id: PydanticObjectId
    receiver_id: Optional[PydanticObjectId] = None
    content: str
    type: str = "TEXT" # TEXT, IMAGE, FILE
    media_url: Optional[str] = None

    created_at: datetime = Field(default_factory=vietnam_now)

    class Settings:
        name = "messages"
        # Tạo index để query lịch sử chat cực nhanh
        indexes = [
            [("conversation_id", 1), ("created_at", -1)]
        ]