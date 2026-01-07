// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import SignUpPage from './pages/SignUpPage'; // <--- 1. Import trang đăng ký
import useAuthStore from './store/useAuthStore';
import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast'; // <--- Thêm Toaster để hiện thông báo đẹp

interface ProtectedRouteProps {
  children: ReactNode;
}

// Component bảo vệ: Yêu cầu phải đăng nhập mới được vào
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Component Public: Nếu đã đăng nhập thì đá về Chat (tránh vào lại Login/Signup)
const PublicRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/chat" />;
};

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      {/* Nơi hiển thị thông báo toast (Góc trên cùng) */}
      <Toaster position="top-center" />

      <Routes>
        {/* 1. Trang chủ: Tự điều hướng */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/chat" /> : <Navigate to="/login" />} 
        />
        
        {/* 2. Trang Đăng nhập (Chỉ cho người chưa login) */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        
        {/* 3. Trang Đăng ký (MỚI THÊM) */}
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <SignUpPage />
            </PublicRoute>
          } 
        />
        
        {/* 4. Trang Chat (Bảo mật) */}
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Route bắt lỗi 404: Quay về trang chủ */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;