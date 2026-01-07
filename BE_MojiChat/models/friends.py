from beanie import Document, PydanticObjectId
from datetime import datetime
from pydantic import Field

class FriendRequest(Document):
    sender_id: PydanticObjectId   # Người gửi
    receiver_id: PydanticObjectId # Người nhận
    status: str = "PENDING"       # PENDING, ACCEPTED, DECLINED
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "friend_requests"