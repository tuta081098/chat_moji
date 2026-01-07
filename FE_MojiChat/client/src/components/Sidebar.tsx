import { useEffect, useState } from "react";
import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";
import AddFriendModal from "./AddFriendModal";
import { useNavigate } from "react-router-dom"; // Import điều hướng

const Sidebar = () => {
  const {
    getFriends,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    friendRequests,
    getFriendRequests,
    disconnectSocket // Lấy hàm ngắt kết nối socket
  } = useChatStore();

  const { user: currentUser, logout } = useAuthStore(); // Lấy hàm logout và user
  const [showAddFriend, setShowAddFriend] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getFriends();
    getFriendRequests();
  }, [getFriends, getFriendRequests]);

  // Hàm xử lý Đăng xuất
  const handleLogout = () => {
    disconnectSocket(); // 1. Ngắt kết nối Realtime
    logout();           // 2. Xóa token & user data
    navigate("/login"); // 3. Chuyển về trang Login
  };

  return (
    <>
      <aside className="h-full w-20 lg:w-80 border-r border-base-300 flex flex-col transition-all duration-200 bg-white shadow-lg z-10">

        {/* --- HEADER: Tiêu đề & Nút thêm bạn --- */}
        <div className="border-b border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 hidden lg:block">Đoạn chat</h2>

            <button
              onClick={() => setShowAddFriend(true)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-2 rounded-full relative transition-colors"
              title="Thêm bạn bè"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 012.25 20.5a12.319 12.319 0 01-6.939-2.25z" />
              </svg>
              {friendRequests.length > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>
          </div>

          <div className="hidden lg:block relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input type="text" placeholder="Tìm kiếm..." className="w-full bg-gray-100 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" />
          </div>
        </div>

        {/* --- BODY: Danh sách bạn bè --- */}
        <div className="overflow-y-auto w-full flex-1 py-2 scrollbar-hide">
          {isUsersLoading ? (
            <div className="flex flex-col gap-3 p-4">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>)}
            </div>
          ) : (
            users
              .filter(user => user.id !== currentUser?.id)
              .map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-indigo-50 transition-colors border-l-4 border-transparent
                  ${selectedUser?.id === user.id ? "bg-indigo-50 border-indigo-600" : ""}
                `}
                >
                  <div className="relative mx-auto lg:mx-0 shrink-0">
                    {/* Avatar bạn bè */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {/* Nếu có avatar url thì hiện ảnh, không thì hiện chữ cái đầu */}
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avt" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 size-3.5 bg-green-500 rounded-full ring-2 ring-white" />
                  </div>

                  <div className="hidden lg:block text-left min-w-0 flex-1">
                    <div className="font-semibold truncate text-gray-900">{user.full_name || user.username}</div>
                    <div className="text-xs text-gray-500 truncate">Nhấn để trò chuyện</div>
                  </div>
                </button>
              ))
          )}

          {users.length === 0 && !isUsersLoading && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 p-4 text-center">
              <span className="text-3xl mb-2">👋</span>
              <p className="text-sm">Chưa có cuộc trò chuyện nào.</p>
            </div>
          )}
        </div>

        {/* --- FOOTER: Thông tin User & Đăng xuất --- */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between gap-2">

            {/* User Info */}
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
                {currentUser?.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block min-w-0">
                <p className="font-bold text-sm text-gray-800 truncate">{currentUser?.full_name || currentUser?.username}</p>
                <p className="text-xs text-green-600 font-medium">● Online</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Đăng xuất"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>

      </aside>

      {/* Modal thêm bạn */}
      {showAddFriend && <AddFriendModal onClose={() => setShowAddFriend(false)} />}
    </>
  );
};

export default Sidebar;