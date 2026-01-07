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
    isLoadingMore, // Vẫn lấy state này để hiện spinner
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages
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

  // 1. Initial Load
  useEffect(() => {
    if (selectedUser) getMessages(selectedUser.id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser]); // Bỏ các dependency thừa để tránh re-run không cần thiết

  // --- 2. LOGIC QUAN TRỌNG NHẤT: XỬ LÝ CUỘN (GỘP CHUNG) ---
  useLayoutEffect(() => {
    if (!containerRef.current || !messages.length) return;

    const currentScrollHeight = containerRef.current.scrollHeight;
    
    // TRƯỜNG HỢP A: Đang Load More (người dùng cuộn lên)
    if (prevScrollHeightRef.current > 0) {
        // Tính độ chênh lệch chiều cao do tin nhắn mới thêm vào trên đầu
        const scrollDiff = currentScrollHeight - prevScrollHeightRef.current;
        
        // Dịch thanh cuộn xuống một đoạn đúng bằng chiều cao tin mới thêm
        // Giúp mắt người dùng vẫn nhìn thấy tin nhắn cũ
        containerRef.current.scrollTop = containerRef.current.scrollTop + scrollDiff;
        
        // Reset lại để lần sau không nhảy vào đây nữa
        prevScrollHeightRef.current = 0;
    } 
    // TRƯỜNG HỢP B: Tin nhắn mới hoặc Lần đầu vào (Tự động cuộn xuống đáy)
    else {
        // Chỉ cuộn xuống đáy nếu KHÔNG PHẢI đang load more
        // (Logic này thay thế hoàn toàn useEffect cũ)
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); 
  // --------------------------------------------------------

  // 3. Sự kiện Scroll: Bắt sự kiện khi kéo lên đỉnh
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight } = e.currentTarget;

    // Nếu cuộn lên sát đỉnh (còn 50px) và không đang load
    if (scrollTop < 50 && !isLoadingMore && !isMessagesLoading) {
        // LƯU LẠI CHIỀU CAO TRƯỚC KHI LOAD (Đây là chìa khóa)
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
        className="flex-1 overflow-y-auto p-4 space-y-4" // Bỏ scroll-smooth ở đây để tránh xung đột khi chỉnh scrollTop thủ công
      >
        {/* Loading Spinner cho Load More */}
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
                            <p className="text-sm md:text-base">{msg.content}</p>
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