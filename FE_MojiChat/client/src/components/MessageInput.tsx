import { useState } from "react";
import useChatStore from "../store/useChatStore";

const MessageInput = () => {
  const [text, setText] = useState("");
  const { sendMessage } = useChatStore();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    await sendMessage(text);
    setText(""); // Clear input
  };

  return (
    <div className="p-4 w-full bg-white border-t border-gray-200">
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          type="text"
          className="flex-1 input border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder="Nhập tin nhắn..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button 
          type="submit"
          className="bg-indigo-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-indigo-700 transition-colors"
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default MessageInput;