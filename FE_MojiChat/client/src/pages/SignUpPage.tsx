import { useState } from "react";
import useAuthStore from "../store/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, MessageSquare, User, Mail, Lock, Loader2, AtSign, Smile } from "lucide-react";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  
  // State form khớp với RegisterData trong store
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!formData.full_name.trim()) return toast.error("Vui lòng nhập Họ tên");
    if (!formData.username.trim()) return toast.error("Vui lòng nhập Tên đăng nhập");
    if (/\s/.test(formData.username)) return toast.error("Username không được chứa khoảng trắng");
    if (!formData.email.trim()) return toast.error("Vui lòng nhập Email");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Email không hợp lệ");
    if (!formData.password) return toast.error("Vui lòng nhập Mật khẩu");
    if (formData.password.length < 6) return toast.error("Mật khẩu phải từ 6 ký tự");

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = validateForm();
    if (success === true) {
       const isSuccess = await signup(formData);
       // Nếu đăng ký thành công -> Chuyển về trang Login
       if (isSuccess) navigate("/login"); 
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Cột Trái: Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Tạo tài khoản</h1>
              <p className="text-base-content/60">Tham gia MojiChat miễn phí</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Họ và tên */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Họ và tên</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Smile className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full pl-10 h-12 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nguyễn Văn A"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            </div>

            {/* 2. Username (Quan trọng cho Backend của bạn) */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Tên đăng nhập (Username)</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSign className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full pl-10 h-12 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="nguyenvana123"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            {/* 3. Email */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Email</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-base-content/40" />
                </div>
                <input
                  type="email"
                  className="input input-bordered w-full pl-10 h-12 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* 4. Password */}
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Mật khẩu</span></label>
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
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-5 text-base-content/40" /> : <Eye className="size-5 text-base-content/40" />}
                </button>
              </div>
            </div>

            <button 
                type="submit" 
                className="btn btn-primary w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-lg mt-4 flex justify-center items-center" 
                disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                "Đăng ký tài khoản"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Đã có tài khoản?{" "}
              <Link to="/login" className="link link-primary text-indigo-600 font-semibold hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Cột Phải: Ảnh minh họa */}
      <div className="hidden lg:flex items-center justify-center bg-indigo-50 p-12">
        <div className="max-w-md text-center">
             {/* Bạn có thể thay bằng ảnh khác hoặc dùng tạm thẻ div */}
             <div className="w-64 h-64 bg-indigo-200 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                <MessageSquare className="size-32 text-indigo-500" />
             </div>
             <h2 className="text-3xl font-bold text-gray-800 mb-4">Kết nối không giới hạn</h2>
             <p className="text-gray-600">Tạo tài khoản ngay để bắt đầu trò chuyện với bạn bè.</p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;