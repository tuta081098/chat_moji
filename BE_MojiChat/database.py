import motor.motor_asyncio
from beanie import init_beanie
from models.users import User
from models.chat import Conversation, Message
from models.friends import FriendRequest

# Thay đổi URL nếu bạn dùng MongoDB Atlas (Cloud)
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "chat_moji_db"

async def init_db():
    # Tạo client kết nối bất đồng bộ
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)

    # Chọn database
    database = client[DB_NAME]

    # Khởi tạo Beanie với các Models đã định nghĩa
    # Lúc này Beanie sẽ tự động kiểm tra và tạo Collection/Index nếu chưa có
    await init_beanie(database=database, document_models=[
        User,
        Conversation,
        Message,
        FriendRequest
    ])