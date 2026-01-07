from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from models.chat import Conversation, Message
from models.users import User
from pydantic import BaseModel
from typing import List, Optional
from beanie import PydanticObjectId

router = APIRouter(tags=["Chat"])

# Schema input để tạo cuộc trò chuyện
class ConversationCreate(BaseModel):
    participant_id: str

@router.post("/conversations", status_code=200)
async def create_conversation(data: ConversationCreate, current_user_id: str):
    # 1. Kiểm tra đối phương
    partner = await User.get(PydanticObjectId(data.participant_id))
    if not partner:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")

    user_id_1 = PydanticObjectId(current_user_id)
    user_id_2 = PydanticObjectId(data.participant_id)

    # 2. Tìm hội thoại cũ
    existing_conv = await Conversation.find_one({
        "members": { "$all": [user_id_1, user_id_2] }
    })

    if existing_conv:
        return {
            "conversation_id": str(existing_conv.id),
            "message": "Đã lấy lại hội thoại cũ"
        }

    # 3. Tạo mới
    new_conv = Conversation(
        members=[user_id_1, user_id_2],
        type="DIRECT"
    )
    await new_conv.create()

    return {
        "conversation_id": str(new_conv.id),
        "message": "Tạo hội thoại mới thành công"
    }

# Schema trả về tin nhắn
class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: Optional[str] = None # Nên thêm trường này nếu frontend cần
    content: str
    created_at: datetime

# --- API NÂNG CẤP PHÂN TRANG ---
@router.get("/{other_user_id}/messages", response_model=List[MessageResponse])
async def get_messages(
        other_user_id: str,
        current_user_id: str,
        limit: int = 20,  # Mặc định lấy 20 tin
        skip: int = 0     # Mặc định không bỏ qua tin nào (lấy tin mới nhất)
):
    # 1. Tìm cuộc hội thoại
    conversation = await Conversation.find_one({
        "members": {"$all": [PydanticObjectId(current_user_id), PydanticObjectId(other_user_id)]}
    })

    if not conversation:
        return []

    # 2. Query Message với Logic Phân Trang
    # - sort("-created_at"): Sắp xếp MỚI NHẤT lên đầu để skip/limit hoạt động đúng với dữ liệu gần đây.
    # - skip(skip): Bỏ qua số lượng tin đã load.
    # - limit(limit): Chỉ lấy số lượng quy định.
    messages = await Message.find(
        Message.conversation_id == conversation.id
    ).sort("-created_at").skip(skip).limit(limit).to_list()

    # 3. Đảo ngược lại danh sách (Quan trọng)
    # Vì lúc query ta lấy tin MỚI NHẤT trước (để phân trang),
    # nhưng Frontend cần hiển thị theo dòng thời gian (CŨ -> MỚI: Từ trên xuống dưới).
    messages.reverse()

    # 4. Convert dữ liệu trả về
    return [
        MessageResponse(
            id=str(msg.id),
            sender_id=str(msg.sender_id),
            # Thêm logic check receiver_id nếu trong DB có lưu, nếu không thì để None hoặc sửa logic này tùy Model
            receiver_id=str(msg.receiver_id) if hasattr(msg, 'receiver_id') and msg.receiver_id else None,
            content=msg.content,
            created_at=msg.created_at
        )
        for msg in messages
    ]