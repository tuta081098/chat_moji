// src/types/auth.ts

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  username: string;
  token_type: string;
}

// Định nghĩa lỗi trả về từ Backend
export interface ApiError {
  detail: string;
}