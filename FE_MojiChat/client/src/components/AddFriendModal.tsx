import { useEffect, useState } from "react";
import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";

interface Props {
    onClose: () => void;
}

const AddFriendModal = ({ onClose }: Props) => {
    const [activeTab, setActiveTab] = useState<"search" | "requests">("search");
    const { user: currentUser } = useAuthStore();
    const {
        searchUsers, searchResults, sendFriendRequest,
        getFriendRequests, friendRequests, acceptFriendRequest,
        users: currentFriends // Lấy danh sách bạn bè hiện tại để ẩn nút kết bạn
    } = useChatStore();

    useEffect(() => {
        if (activeTab === "search") searchUsers();
        if (activeTab === "requests") getFriendRequests();
    }, [activeTab]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in">
                {/* Header Modal */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Thêm bạn bè</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-4">
                    <button
                        onClick={() => setActiveTab("search")}
                        className={`flex-1 py-2 font-medium ${activeTab === "search" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}
                    >
                        Tìm mọi người
                    </button>
                    <button
                        onClick={() => setActiveTab("requests")}
                        className={`flex-1 py-2 font-medium ${activeTab === "requests" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}
                    >
                        Lời mời {friendRequests.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{friendRequests.length}</span>}
                    </button>
                </div>

                {/* Content */}
                <div className="h-64 overflow-y-auto pr-2 space-y-3">

                    {/* TAB 1: TÌM KIẾM */}
                    {activeTab === "search" && (
                        searchResults.length === 0
                            ? <div className="text-center text-gray-500 mt-10">Không tìm thấy ai</div>
                            : searchResults
                                .filter(u => u.id !== currentUser?.id) // Lọc chính mình
                                .filter(u => !currentFriends.some(f => f.id === u.id)) // Lọc những người đã là bạn
                                .map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{user.full_name || user.username}</p>
                                                <p className="text-xs text-gray-500">@{user.username}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => sendFriendRequest(user.id)}
                                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
                                        >
                                            Kết bạn
                                        </button>
                                    </div>
                                ))
                    )}

                    {/* TAB 2: LỜI MỜI */}
                    {activeTab === "requests" && (
                        friendRequests.length === 0
                            ? <div className="text-center text-gray-500 mt-10">Không có lời mời nào</div>
                            : friendRequests.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center text-orange-700 font-bold">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{user.full_name || user.username}</p>
                                            <p className="text-xs text-gray-500">Muốn kết bạn</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => acceptFriendRequest(user.id)}
                                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm"
                                    >
                                        Đồng ý
                                    </button>
                                </div>
                            ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddFriendModal;