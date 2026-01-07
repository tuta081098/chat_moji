import { useState } from "react";
import useAuthStore from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Eye, EyeOff, MessageSquare, User, Lock, Loader2 } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const { login, isLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Gọi hàm login (Store sẽ tự handle việc chuyển trang và thông báo lỗi)
    await login(formData.username, formData.password);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* CỘT TRÁI: FORM ĐĂNG NHẬP */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Chào mừng trở lại</h1>
              <p className="text-base-content/60">Đăng nhập tài khoản MojiChat của bạn</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Username */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Tên đăng nhập</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full pl-10 h-12 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nhập tên đăng nhập"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Mật khẩu</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10 h-12 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            {/* Button Submit */}
            <button 
                type="submit" 
                className="btn btn-primary w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-lg font-semibold flex justify-center items-center shadow-lg shadow-indigo-500/20" 
                disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center">
            <p className="text-base-content/60">
              Chưa có tài khoản?{" "}
              {/* QUAN TRỌNG: Link trỏ về /signup cho khớp với App.tsx */}
              <Link to="/signup" className="link link-primary text-indigo-600 font-semibold hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: ẢNH MINH HỌA (Giống SignUpPage cho đồng bộ) */}
      <div className="hidden lg:flex items-center justify-center bg-indigo-50 p-12">
        <div className="max-w-md text-center">
             {/* Placeholder Image hoặc Icon */}
             <div className="w-64 h-64 bg-indigo-200 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce-slow">
                <MessageSquare className="size-32 text-indigo-500" />
             </div>
             <h2 className="text-3xl font-bold text-gray-800 mb-4">Chat mọi lúc, mọi nơi</h2>
             <p className="text-gray-600">
               Trải nghiệm nhắn tin thời gian thực, nhanh chóng và bảo mật cùng MojiChat.
             </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;