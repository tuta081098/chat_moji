import { useEffect, useRef, useLayoutEffect } from "react";
import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";

const ChatContainer = () => {
  const { 
    messages, 
    getMessages, 
    loadMoreMessages, 
    isMessagesLoading, 
    isLoadingMore, 
    selectedUser,
    // Đã xóa 2 hàm subscribe/unsubscribe gây lỗi ở đây
  } = useChatStore();
  
  const { user: currentUser } = useAuthStore();
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); 
  const prevScrollHeightRef = useRef<number>(0); 

  const formatTime = (dateString: string) => {
    if (!dateString) return "...";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 1. Initial Load (Đã sửa lại gọn gàng)
  useEffect(() => {
    if (selectedUser) {
        getMessages(selectedUser.id);
    }
  }, [selectedUser, getMessages]); 

  // --- 2. LOGIC XỬ LÝ CUỘN (GIỮ NGUYÊN VÌ LOGIC NÀY TỐT) ---
  useLayoutEffect(() => {
    if (!containerRef.current || !messages.length) return;

    const currentScrollHeight = containerRef.current.scrollHeight;
    
    // TRƯỜNG HỢP A: Đang Load More (Giữ vị trí đọc)
    if (prevScrollHeightRef.current > 0) {
        const scrollDiff = currentScrollHeight - prevScrollHeightRef.current;
        containerRef.current.scrollTop = containerRef.current.scrollTop + scrollDiff;
        prevScrollHeightRef.current = 0;
    } 
    // TRƯỜNG HỢP B: Tin nhắn mới (Cuộn xuống đáy)
    else {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); 
  // --------------------------------------------------------

  // 3. Sự kiện Scroll Load More
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight } = e.currentTarget;
    if (scrollTop < 50 && !isLoadingMore && !isMessagesLoading) {
        prevScrollHeightRef.current = scrollHeight;
        loadMoreMessages();
    }
  };

  if (isMessagesLoading) {
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
           <ChatHeader />
           <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
           </div>
           <MessageInput />
        </div>
      );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <ChatHeader />

      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoadingMore && (
            <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
            </div>
        )}

        {messages.map((msg, idx) => {
            const isMyMessage = msg.sender_id === currentUser?.id;
            
            return (
                <div key={msg.id || idx} className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}>
                    <div className="flex flex-col max-w-[70%]">
                        <div className={`
                            px-4 py-2 shadow-sm relative break-words
                            ${isMyMessage 
                                ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none" 
                                : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-none"
                            }
                        `}>
                            {/* --- LOGIC HIỂN THỊ ẢNH HOẶC TEXT --- */}
                            {msg.image_url ? (
                                <img 
                                    src={msg.image_url} 
                                    alt="Sent attachment" 
                                    className="rounded-lg max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition"
                                    onClick={() => window.open(msg.image_url, '_blank')}
                                />
                            ) : (
                                <p className="text-sm md:text-base">{msg.content}</p>
                            )}
                            {/* ------------------------------------ */}
                        </div>
                        <div className={`text-[10px] mt-1 px-1 opacity-70 ${isMyMessage ? "text-right" : "text-left"}`}>
                            {formatTime(msg.created_at)}
                        </div>
                    </div>
                </div>
            )
        })}
        
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;