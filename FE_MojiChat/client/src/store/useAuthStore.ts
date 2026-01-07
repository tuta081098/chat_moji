// src/store/useAuthStore.ts
import { create } from 'zustand';
import { AxiosError } from 'axios';
import type { LoginResponse, User } from '../types/auth';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-hot-toast'; // Thêm toast để thông báo đẹp hơn

// 1. Định nghĩa kiểu dữ liệu cho Form Đăng ký (Khớp với Backend)
interface RegisterData {
  username: string;
  email: string;
  full_name: string;
  password: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSigningUp: boolean; // <--- MỚI: Trạng thái loading khi đăng ký
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  signup: (data: RegisterData) => Promise<boolean>; // <--- MỚI: Hàm đăng ký
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  // State khởi tạo
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  isSigningUp: false, // <--- MỚI
  error: null,

  // Action Login (Giữ nguyên của bạn)
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await axiosClient.post<any, LoginResponse>('/auth/login', { username, password });
      
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      // Backend bạn trả về user_id và username trong response login
      const userInfo: User = { id: data.user_id, username: data.username }; 
      localStorage.setItem('user', JSON.stringify(userInfo));

      set({ 
        isAuthenticated: true, 
        user: userInfo, 
        isLoading: false 
      });
      toast.success("Đăng nhập thành công!");
      return true;
    } catch (err: any) {
      const errorMessage = (err as AxiosError<{detail: string}>).response?.data?.detail || "Đăng nhập thất bại";
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  // Action Signup (MỚI THÊM)
  signup: async (data) => {
    set({ isSigningUp: true, error: null });
    try {
      // Gọi đúng đường dẫn Backend: /auth/register
      await axiosClient.post('/auth/register', data);
      
      toast.success("Tạo tài khoản thành công! Hãy đăng nhập.");
      set({ isSigningUp: false });
      return true; // Trả về true để component biết đường chuyển trang
    } catch (err: any) {
      const errorMessage = (err as AxiosError<{detail: string}>).response?.data?.detail || "Đăng ký thất bại";
      set({ error: errorMessage, isSigningUp: false });
      toast.error(errorMessage);
      return false;
    }
  },

  // Action Logout (Giữ nguyên)
  logout: () => {
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
    toast.success("Đã đăng xuất");
  }
}));

export default useAuthStore;