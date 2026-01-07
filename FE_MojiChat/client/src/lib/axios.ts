import axios from "axios";

// Cấu hình đường dẫn API Backend
// Nếu chạy local thì thường là http://localhost:8000/api
// Lưu ý: BASE_URL này phải khớp với backend của bạn
export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" 
    ? "http://localhost:8000/api"  // URL khi chạy dev
    : "/api",                        // URL khi build production
  withCredentials: true, // QUAN TRỌNG: Để gửi kèm cookie/session
});