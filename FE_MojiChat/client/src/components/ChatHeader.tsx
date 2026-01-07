import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { user: currentUser } = useAuthStore();

  return (
    <div className="p-2.5 border-b border-base-300 w-full bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            {selectedUser?.username.charAt(0).toUpperCase()}
          </div>
          
          {/* User Info */}
          <div>
            <h3 className="font-medium">{selectedUser?.full_name || selectedUser?.username}</h3>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>

        {/* Close Button */}
        <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;