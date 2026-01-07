# core/socket_manager.py
import socketio
from urllib.parse import parse_qs
from models.chat import Message, Conversation, LastMessagePreview
from beanie import PydanticObjectId
from datetime import datetime, timedelta

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins="*")

@sio.event
async def connect(sid, environ):
    query_string = environ.get('QUERY_STRING', '')
    params = parse_qs(query_string)
    user_id_list = params.get('userId')

    if user_id_list:
        user_id = str(user_id_list[0]).strip()
        # --- SỬA LỖI: Thêm await vào đây ---
        await sio.enter_room(sid, user_id)
        print(f"✅ [CONNECT] SID {sid} đã Join Room: '{user_id}'")
    else:
        print(f"⚠️ [CONNECT] SID {sid} không có User ID")

@sio.on("setup")
async def on_setup(sid, user_id):
    if user_id:
        clean_id = str(user_id).strip()
        # --- SỬA LỖI: Thêm await vào đây ---
        await sio.enter_room(sid, clean_id)
        print(f"✅ [SETUP] SID {sid} đã Join lại Room: '{clean_id}'")
        await sio.emit("connected", room=sid)

@sio.event
async def disconnect(sid):
    print(f"❌ [DISCONNECT] SID {sid} đã thoát")

@sio.on("send_message")
async def handle_send_message(sid, data):
    print(f"📨 [SEND] Data: {data}")

    try:
        sender_id = data.get("sender_id")
        raw_receiver_id = data.get("receiver_id")
        content = data.get("content")
        conversation_id = data.get("conversation_id")

        if not sender_id or not content:
            return

        # Lưu DB
        new_msg = Message(
            conversation_id=PydanticObjectId(conversation_id) if conversation_id else None,
            sender_id=PydanticObjectId(sender_id),
            content=content,
            type="TEXT",
            created_at=datetime.utcnow() + timedelta(hours=7)
        )
        await new_msg.create()

        # Update Conversation
        if conversation_id:
            conversation = await Conversation.get(PydanticObjectId(conversation_id))
            if conversation:
                conversation.last_message = LastMessagePreview(
                    content=content,
                    sender_id=PydanticObjectId(sender_id),
                    created_at=new_msg.created_at,
                    is_read=False
                )
                conversation.updated_at = new_msg.created_at
                await conversation.save()

        # Data trả về
        response_data = {
            "id": str(new_msg.id),
            "content": new_msg.content,
            "sender_id": str(new_msg.sender_id),
            "receiver_id": raw_receiver_id,
            "created_at": new_msg.created_at.isoformat(),
            "conversation_id": conversation_id
        }

        # --- GỬI REALTIME ---

        # 1. Gửi cho NGƯỜI NHẬN (Qua Room)
        if raw_receiver_id:
            clean_receiver_id = str(raw_receiver_id).strip()

            # Debug user trong phòng
            try:
                participants = sio.manager.get_participants(namespace='/', room=clean_receiver_id)
                p_list = list(participants)
                print(f"🧐 [DEBUG ROOM] Phòng '{clean_receiver_id}' hiện có {len(p_list)} người.")
            except:
                pass

            print(f"🚀 Bắn tin tới Room: '{clean_receiver_id}'")
            await sio.emit('receive_message', response_data, room=clean_receiver_id)

        # 2. Gửi cho NGƯỜI GỬI (Trực tiếp qua SID)
        print(f"↩️ Phản hồi cho Sender (SID {sid})")
        await sio.emit('receive_message', response_data, to=sid)

    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()