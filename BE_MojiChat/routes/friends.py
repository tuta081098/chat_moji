from fastapi import APIRouter, HTTPException, Body
from models.users import User
from models.friends import FriendRequest
from schemas.users import UserResponse
from beanie import PydanticObjectId
from typing import List
from beanie.operators import In

router = APIRouter(tags=["Friends"])

# 1. Gửi lời mời kết bạn
@router.post("/request")
async def send_friend_request(
        receiver_id: str = Body(..., embed=True),
        current_user_id: str = Body(..., embed=True) # Thực tế sẽ lấy từ Token
):
    # Check 1: Không được tự kết bạn với chính mình
    if receiver_id == current_user_id:
        raise HTTPException(status_code=400, detail="Không thể kết bạn với chính mình")

    # Check 2: Người nhận có tồn tại không
    receiver = await User.get(PydanticObjectId(receiver_id))
    if not receiver:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")

    # Check 3: Đã là bạn bè chưa
    sender = await User.get(PydanticObjectId(current_user_id))
    if PydanticObjectId(receiver_id) in sender.friends:
        raise HTTPException(status_code=400, detail="Hai người đã là bạn bè")

    # Check 4: Đã có lời mời nào đang chờ chưa (Tránh spam)
    existing_request = await FriendRequest.find_one({
        "sender_id": PydanticObjectId(current_user_id),
        "receiver_id": PydanticObjectId(receiver_id),
        "status": "PENDING"
    })

    if existing_request:
        raise HTTPException(status_code=400, detail="Đã gửi lời mời trước đó")

    # Tạo lời mời mới
    new_request = FriendRequest(
        sender_id=PydanticObjectId(current_user_id),
        receiver_id=PydanticObjectId(receiver_id)
    )
    await new_request.create()

    return {"message": "Đã gửi lời mời kết bạn"}

# 2. Xem danh sách lời mời đã nhận
@router.get("/requests/received", response_model=List[UserResponse], response_model_by_alias=False) # <--- Thêm
async def get_received_requests(current_user_id: str):
    # Tìm các request gửi đến mình có status PENDING
    requests = await FriendRequest.find(
        FriendRequest.receiver_id == PydanticObjectId(current_user_id),
        FriendRequest.status == "PENDING"
    ).to_list()

    # Lấy thông tin chi tiết của người gửi (sender)
    sender_ids = [req.sender_id for req in requests]
    senders = await User.find(In(User.id, sender_ids)).to_list()

    return senders

# 3. Chấp nhận lời mời
@router.post("/accept")
async def accept_friend_request(
        sender_id: str = Body(..., embed=True),
        current_user_id: str = Body(..., embed=True)
):
    # Tìm lời mời
    request = await FriendRequest.find_one({
        "sender_id": PydanticObjectId(sender_id),
        "receiver_id": PydanticObjectId(current_user_id),
        "status": "PENDING"
    })

    if not request:
        raise HTTPException(status_code=404, detail="Lời mời không tồn tại hoặc đã xử lý")

    # Cập nhật trạng thái request -> ACCEPTED
    request.status = "ACCEPTED"
    await request.save()

    # Thêm bạn vào danh sách friends của CẢ HAI NGƯỜI
    # Update cho người nhận (Mình)
    await User.find_one(User.id == PydanticObjectId(current_user_id)).update(
        {"$push": {"friends": PydanticObjectId(sender_id)}}
    )

    # Update cho người gửi (Họ)
    await User.find_one(User.id == PydanticObjectId(sender_id)).update(
        {"$push": {"friends": PydanticObjectId(current_user_id)}}
    )

    return {"message": "Đã trở thành bạn bè"}

# 4. Lấy danh sách bạn bè (Thay thế API get all users cũ)
@router.get("/list", response_model=List[UserResponse], response_model_by_alias=False) # <--- Thêm
async def get_friend_list(current_user_id: str):
    user = await User.get(PydanticObjectId(current_user_id))
    if not user or not user.friends:
        return []

    # Lấy thông tin chi tiết các user trong list friends
    friends = await User.find(User.id << user.friends).to_list()
    return friends