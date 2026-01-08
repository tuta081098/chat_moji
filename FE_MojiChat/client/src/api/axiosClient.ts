// src/api/axiosClient.ts

import axios, { type InternalAxiosRequestConfig, type AxiosResponse, AxiosError } from "axios";

const axiosClient = axios.create({
  // baseURL: import.meta.env.VITE_API_URL+"/api" || 'http://localhost:8000/api',
  baseURL: 'https://chat-moji.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor Request
axiosClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor Response
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      console.log("Token hết hạn hoặc không hợp lệ");
      // Có thể xử lý logout tại đây nếu cần
    }
    return Promise.reject(error);
  }
);

export default axiosClient;