import { useEffect } from "react";
import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";

const ChatPage = () => {
  const { user } = useAuthStore();
  const { connectSocket, selectedUser } = useChatStore();

  useEffect(() => {
    if (user?.id) {
        connectSocket(user.id);
    }

  }, [user, connectSocket]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
        <Sidebar />

        {/* Logic hiển thị */}
        {!selectedUser ? (
             <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 text-center animate-fade-in">
                <div className="bg-indigo-50 p-6 rounded-full mb-4">
                    <span className="text-6xl">💬</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-700">Chào mừng đến với Chat Moji</h2>
                <p className="text-gray-500 mt-2">Chọn một người bạn từ danh sách để bắt đầu trò chuyện</p>
            </div>
        ) : (
            <ChatContainer />
        )}
    </div>
  );
};

export default ChatPage;