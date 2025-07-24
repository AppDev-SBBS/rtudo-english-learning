"use client";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getChatHistoryList } from "@/app/utils/firebaseChatUtils";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MdArrowBack, MdChatBubbleOutline } from "react-icons/md";
import Loader from "@/app/components/Loader";

export default function ChatHistoryPage() {
  const [history, setHistory] = useState([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const user = getAuth().currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const data = await getChatHistoryList(user.uid);
      setHistory(data);
      setLoading(false);
    };

    fetchHistory();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans relative">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 w-full bg-gray-900 z-10 border-b border-gray-700 shadow-lg">
        <div className="px-4 py-4 max-w-3xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <MdArrowBack size={24} />
          </button>
          <h2 className="text-lg font-semibold text-white">Chat History</h2>
        </div>
      </div>

      {/* Scrollable Chat History List */}
      <div className="pt-[100px] pb-28 px-4 max-w-3xl mx-auto space-y-3">
        {history.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            No chats yet. Start a new conversation to see it here.
          </div>
        ) : (
          history.map((chat, index) => (
            <div
              key={index}
              onClick={() => router.push(`/ai/chat-detail?id=${chat.chatId}`)}
              className="bg-gray-800 p-4 rounded-xl shadow-lg cursor-pointer hover:bg-gray-750 hover:shadow-xl transition-all duration-200 border border-gray-700"
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1 text-purple-400 font-semibold text-sm">
                  <MdChatBubbleOutline size={18} />
                  <span>Chat</span>
                </div>
                <span className="text-xs text-gray-500">
                  {format(chat.lastUpdated, "MMM d, yyyy, hh:mm a")}
                </span>
              </div>
              <p className="text-gray-200 text-sm line-clamp-2">{chat.preview}</p>
              <p className="text-xs text-gray-500 mt-1">
                {chat.messagesCount} message{chat.messagesCount !== 1 ? "s" : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}