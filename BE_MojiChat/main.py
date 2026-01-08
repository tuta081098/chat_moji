import uvicorn
import socketio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import friends

from database import init_db
from routes import auth, chat
from core.socket_manager import sio  # Instance của Socket.IO

# --- 1. Cấu hình Vòng đời ứng dụng (Lifespan) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 [STARTUP] Đang khởi tạo Database...")
    try:
        await init_db()
        print("✅ [DB] Kết nối MongoDB thành công!")
    except Exception as e:
        print(f"❌ [DB] Lỗi kết nối Database: {e}")

    yield  # Server chạy tại đây

    print("🛑 [SHUTDOWN] Server đang tắt...")

# --- 2. Khởi tạo FastAPI App ---
app = FastAPI(
    title="Chat Moji API",
    description="Backend API for Chat Moji Application using FastAPI + MongoDB + Socket.IO",
    version="1.0.0",
    lifespan=lifespan
)

# --- 3. Cấu hình CORS (Quan trọng cho React) ---
# Cho phép Frontend (thường chạy ở port 5173 hoặc 3000) gọi API
origins = [
    "http://localhost:5173", # Vite React default
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "*", # Tạm thời mở hết để test cho dễ
    "https://ten-du-an-cua-ban.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. --- QUAN TRỌNG: Mount Socket.IO vào FastAPI ---
# Tạo một ứng dụng ASGI cho Socket.IO
socket_app = socketio.ASGIApp(sio, socketio_path="")

# Mount nó vào đường dẫn /socket.io
app.mount("/socket.io", socket_app)

# --- 4. Đăng ký các Routes (API) ---
app.include_router(auth.router, prefix="/api/auth")
app.include_router(chat.router, prefix="/api/chat")
app.include_router(friends.router, prefix="/api/friends")

@app.get("/")
async def root():
    return {
        "message": "Welcome to Chat Moji API",
        "docs": "http://localhost:8000/docs",
        "status": "Running"
    }

# --- 5. Tích hợp Socket.IO (ASGI App) ---
# Wrap FastAPI app bằng Socket.IO để chạy chung trên 1 port
# socket_io_path='socket.io': Đường dẫn mặc định client sẽ gọi
socket_app = socketio.ASGIApp(sio, app, socketio_path='socket.io')

# --- 6. Entry Point ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)