import { create } from 'zustand';
import axiosClient from '../api/axiosClient';
import io, { Socket } from 'socket.io-client';
import useAuthStore from './useAuthStore';
import type { User } from '../types/auth';

// --- 1. XỬ LÝ BIẾN MÔI TRƯỜNG ---
// Tự động nhận diện Vite hoặc CRA. Nếu không có thì fallback về localhost
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  receiver_id: string;
  conversation_id?: string;
  image_url?: string; // Thêm field này nếu bạn làm gửi ảnh
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

  // Pagination
  hasMore: boolean;       
  isLoadingMore: boolean; 

  // Actions
  getFriends: () => Promise<void>;
  getFriendRequests: () => Promise<void>;
  searchUsers: () => Promise<void>; 

  sendFriendRequest: (receiverId: string) => Promise<void>;
  acceptFriendRequest: (senderId: string) => Promise<void>;

  getMessages: (userId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>; 
  
  setSelectedUser: (user: User | null) => void;
  sendMessage: (content: string, imageUrl?: string) => Promise<void>; // Update support ảnh

  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
  
  // Clean up functions
  resetChat: () => void;
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
  currentConversationId: null,

  hasMore: true,
  isLoadingMore: false,

  getFriends: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosClient.get('/auth/users');
      set({ users: res as unknown as User[] });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getFriendRequests: async () => {
    try {
      const currentUserId = useAuthStore.getState().user?.id;
      const res = await axiosClient.get('/friends/requests/received', {
        params: { current_user_id: currentUserId }
      });
      set({ friendRequests: res as unknown as User[] });
    } catch (error) {
      console.error("Lỗi lấy lời mời:", error);
    }
  },

  searchUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosClient.get('/auth/users');
      set({ searchResults: res as unknown as User[] });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

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

  getMessages: async (userId) => {
    if (!userId) return;
    set({ isMessagesLoading: true, messages: [], hasMore: true }); 

    try {
      const currentUserId = useAuthStore.getState().user?.id;
      const res = await axiosClient.get(
        `/chat/${userId}/messages?current_user_id=${currentUserId}&limit=20&skip=0`
      );
      
      const data = res as unknown as Message[];
      set({ 
        messages: data,
        hasMore: data.length >= 20 
      });
    } catch (error) { 
      set({ messages: [] }); 
    } finally { 
      set({ isMessagesLoading: false }); 
    }
  },

  loadMoreMessages: async () => {
    const { selectedUser, messages, hasMore, isLoadingMore } = get();
    if (!selectedUser || !hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });

    try {
      const currentUserId = useAuthStore.getState().user?.id;
      const skip = messages.length; 

      const res = await axiosClient.get(
        `/chat/${selectedUser.id}/messages?current_user_id=${currentUserId}&limit=20&skip=${skip}`
      );
      
      const newMsgs = res as unknown as Message[];

      if (newMsgs.length > 0) {
        set({
          messages: [...newMsgs, ...messages],
          hasMore: newMsgs.length >= 20
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

    // Lấy tin nhắn
    get().getMessages(user.id);

    // Lấy Conversation ID
    try {
        const currentUser = useAuthStore.getState().user;
        if(currentUser) {
            const res = await axiosClient.post('/chat/conversations',
                { participant_id: user.id },
                { params: { current_user_id: currentUser.id } }
            );
            set({ currentConversationId: (res as any).conversation_id });
        }
    } catch (error) {
        console.error("Lỗi lấy ID hội thoại:", error);
    }
  },

  connectSocket: (userId: string) => {
    const { socket } = get();

    // Nếu socket đã tồn tại và đang kết nối -> Không làm gì cả
    if (socket?.connected) return;

    // --- SỬ DỤNG BASE_URL TỪ ENV ---
    const newSocket = io(BASE_URL, {
      query: { userId },
      transports: ['websocket'], // Bỏ polling để tối ưu tốc độ nếu server hỗ trợ tốt
      withCredentials: true,
      reconnectionAttempts: 5, // Cố kết nối lại 5 lần nếu rớt mạng
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket Connected:", newSocket.id);
      newSocket.emit("setup", userId);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket Disconnected");
    });

    newSocket.on("receive_message", (newMessage: Message) => {
        const { selectedUser, messages, users } = get();
        const currentUser = useAuthStore.getState().user;
        
        const msgSenderId = String(newMessage.sender_id);
        const msgReceiverId = String(newMessage.receiver_id || "");
        const currentUserId = String(currentUser?.id);
        const selectedUserId = selectedUser ? String(selectedUser.id) : null;

        // Logic cập nhật UI Chat
        const isBelongToCurrentChat = 
            (selectedUserId === msgSenderId) || 
            (selectedUserId === msgReceiverId && msgSenderId === currentUserId);

        if (isBelongToCurrentChat) {
            set({ messages: [...messages, newMessage] });
        }

        // Logic đưa user lên đầu danh sách
        const friendIndex = users.findIndex(u => String(u.id) === msgSenderId || String(u.id) === msgReceiverId);
        if (friendIndex !== -1) {
            const updatedUsers = [...users];
            const [friend] = updatedUsers.splice(friendIndex, 1);
            updatedUsers.unshift(friend);
            set({ users: updatedUsers });
        }
    });

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

  // Hỗ trợ gửi ảnh (imageUrl optional)
  sendMessage: async (content: string, imageUrl?: string) => {
    const { selectedUser, socket, currentConversationId } = get();
    const currentUser = useAuthStore.getState().user;

    if (!selectedUser || !currentUser || !socket) return;

    const messageData = {
        conversation_id: currentConversationId,
        sender_id: currentUser.id,
        content: content,
        receiver_id: selectedUser.id,
        image_url: imageUrl || null, // Gửi thêm trường ảnh
        type: imageUrl ? 'image' : 'text' // Flag để FE biết mà render
    };

    socket.emit("send_message", messageData);
  },

  resetChat: () => {
      set({ selectedUser: null, messages: [], currentConversationId: null });
  }
}));

export default useChatStore;