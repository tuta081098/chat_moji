import { create } from 'zustand';
import axiosClient from '../api/axiosClient';
import io, { Socket } from 'socket.io-client';
import useAuthStore from './useAuthStore';
import type { User } from '../types/auth';

const BASE_URL = 'http://localhost:8000';

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  receiver_id: string;
  conversation_id?: string;
}

interface ChatState {
  users: User[];          
  friendRequests: User[]; 
  searchResults: User[];  
  
  selectedUser: User | null;
  messages: Message[];

  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  socket: Socket | null;
  currentConversationId: string | null;

  // --- STATE MỚI CHO PHÂN TRANG ---
  hasMore: boolean;       // Còn tin cũ để load không?
  isLoadingMore: boolean; // Đang tải tin cũ?

  // Actions
  getFriends: () => Promise<void>;
  getFriendRequests: () => Promise<void>;
  searchUsers: () => Promise<void>; 

  sendFriendRequest: (receiverId: string) => Promise<void>;
  acceptFriendRequest: (senderId: string) => Promise<void>;

  getMessages: (userId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>; // <-- Action mới
  
  setSelectedUser: (user: User | null) => void;
  sendMessage: (content: string) => Promise<void>;

  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
  
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  
}

const useChatStore = create<ChatState>((set, get) => ({
  users: [],
  friendRequests: [],
  searchResults: [],
  selectedUser: null,
  messages: [],
  isUsersLoading: false,
  isMessagesLoading: false,
  socket: null,

  // Default state phân trang
  hasMore: true,
  isLoadingMore: false,

  // 1. Lấy danh sách bạn bè
  getFriends: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosClient.get<any, User[]>('/auth/users');
      set({ users: res });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // 2. Lấy danh sách lời mời
  getFriendRequests: async () => {
    try {
      const currentUserId = useAuthStore.getState().user?.id;
      const res = await axiosClient.get<any, User[]>('/friends/requests/received', {
        params: { current_user_id: currentUserId }
      });
      set({ friendRequests: res });
    } catch (error) {
      console.error("Lỗi lấy lời mời:", error);
    }
  },

  // 3. Tìm kiếm user
  searchUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosClient.get<any, User[]>('/auth/users');
      set({ searchResults: res });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // 4. Gửi lời mời
  sendFriendRequest: async (receiverId) => {
    try {
      const currentUserId = useAuthStore.getState().user?.id;
      await axiosClient.post('/friends/request', {
        receiver_id: receiverId,
        current_user_id: currentUserId
      });
      alert("Đã gửi lời mời thành công!");
    } catch (error: any) {
      alert(error.response?.data?.detail || "Lỗi gửi lời mời");
    }
  },

  // 5. Chấp nhận lời mời
  acceptFriendRequest: async (senderId) => {
    try {
      const currentUserId = useAuthStore.getState().user?.id;
      await axiosClient.post('/friends/accept', {
        sender_id: senderId,
        current_user_id: currentUserId
      });
      get().getFriendRequests();
      get().getFriends();
      alert("Đã kết bạn thành công!");
    } catch (error) {
      console.error(error);
    }
  },

  // 6. Lấy tin nhắn (Lần đầu mở chat)
  getMessages: async (userId) => {
    if (!userId || userId === "undefined") return;

    // Reset lại state mỗi khi đổi người chat
    set({ isMessagesLoading: true, messages: [], hasMore: true }); 

    try {
      const currentUserId = useAuthStore.getState().user?.id;
      
      // Thêm params limit & skip = 0
      const res = await axiosClient.get<any, Message[]>(
        `/chat/${userId}/messages?current_user_id=${currentUserId}&limit=20&skip=0`
      );
      
      set({ 
        messages: res,
        hasMore: res.length >= 20 // Nếu trả về ít hơn 20 tin -> Hết tin cũ
      });
    } catch (error) { 
      set({ messages: [] }); 
    } finally { 
      set({ isMessagesLoading: false }); 
    }
  },

  // --- 6.5. Action mới: Load thêm tin nhắn cũ ---
  loadMoreMessages: async () => {
    const { selectedUser, messages, hasMore, isLoadingMore } = get();
    // Nếu không có user, hết tin, hoặc đang load dở -> Dừng
    if (!selectedUser || !hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });

    try {
      const currentUserId = useAuthStore.getState().user?.id;
      // Skip bằng số lượng tin hiện có
      const skip = messages.length; 

      const res = await axiosClient.get<any, Message[]>(
        `/chat/${selectedUser.id}/messages?current_user_id=${currentUserId}&limit=20&skip=${skip}`
      );

      if (res.length > 0) {
        set({
          // Nối tin cũ vào ĐẦU mảng (...res, ...messages)
          messages: [...res, ...messages],
          hasMore: res.length >= 20
        });
      } else {
        set({ hasMore: false });
      }
    } catch (error) {
      console.error("Lỗi load more:", error);
    } finally {
      set({ isLoadingMore: false });
    }
  },

  setSelectedUser: async (user) => {
    set({ selectedUser: user });
    if (!user) return;

    // 1. Lấy tin nhắn cũ
    get().getMessages(user.id);

    // 2. Lấy luôn Conversation ID ngay lúc này!
    try {
        const currentUser = useAuthStore.getState().user;
        if(currentUser) {
            const res = await axiosClient.post<{ conversation_id: string }>(
                '/chat/conversations',
                { participant_id: user.id },
                { params: { current_user_id: currentUser.id } }
            );
            // Lưu ID vào Store dùng dần
            set({ currentConversationId: (res as any).conversation_id });
        }
    } catch (error) {
        console.error("Lỗi lấy ID hội thoại:", error);
    }
  },

  // 7. Logic Socket (CORE)
  connectSocket: (userId: string) => {
    const { socket } = get();

    // 1. CHẶN KẾT NỐI KÉP
    if (socket) {
        if (!socket.connected) {
            socket.connect(); 
        }
        return; 
    }

    // 2. Tạo mới Socket
    const newSocket = io(BASE_URL, {
      query: { userId },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    // 3. Setup sự kiện
    newSocket.on("connect", () => {
      console.log("✅ Socket Connected ID:", newSocket.id);
      newSocket.emit("setup", userId);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket Disconnected");
    });

    // 4. LẮNG NGHE TIN NHẮN
    newSocket.on("receive_message", (newMessage: Message) => {
        console.log("🔥 [SOCKET IN] Nhận tin:", newMessage);
        const { selectedUser, messages, users } = get();
        const currentUser = useAuthStore.getState().user;
        
        const msgSenderId = String(newMessage.sender_id);
        const msgReceiverId = String(newMessage.receiver_id || "");
        const currentUserId = String(currentUser?.id);
        const selectedUserId = selectedUser ? String(selectedUser.id) : null;

        // Logic 1: Cập nhật khung chat
        const isBelongToCurrentChat = 
            (selectedUserId === msgSenderId) || 
            (selectedUserId === msgReceiverId && msgSenderId === currentUserId);

        if (isBelongToCurrentChat) {
            set({ messages: [...messages, newMessage] });
        }

        // Logic 2: Cập nhật Sidebar (Đưa người vừa nhắn lên đầu)
        const friendIndex = users.findIndex(u => String(u.id) === msgSenderId || String(u.id) === msgReceiverId);
        if (friendIndex !== -1) {
            const updatedUsers = [...users];
            const friend = updatedUsers[friendIndex];
            // Xóa vị trí cũ, đưa lên đầu
            updatedUsers.splice(friendIndex, 1);
            updatedUsers.unshift(friend);
            set({ users: updatedUsers });
        }
    });

    // 5. Kết nối
    newSocket.connect();
    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) { 
        socket.disconnect(); 
        set({ socket: null }); 
    }
  },

  // 8. Gửi tin nhắn
  sendMessage: async (content: string) => {
    const { selectedUser, socket, currentConversationId } = get(); // Lấy ID từ Store
    const currentUser = useAuthStore.getState().user;

    if (!selectedUser || !currentUser || !socket) return;

    // --- LOGIC MỚI: Dùng ID đã lưu, KHÔNG GỌI API NỮA ---
    const messageData = {
        conversation_id: currentConversationId, // Dùng biến có sẵn
        sender_id: currentUser.id,
        content: content,
        receiver_id: selectedUser.id
    };

    console.log("📤 Đang gửi tin (Socket only):", messageData);
    
    // Bắn thẳng Socket luôn
    socket.emit("send_message", messageData);
  },

  subscribeToMessages: () => { console.log("Legacy subscribe ignored"); },
  unsubscribeFromMessages: () => { },
  currentConversationId: null,
}));

export default useChatStore;