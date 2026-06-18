import { useAuth } from "../context/AuthContext";

export default function EmptyState({ filter }) {
  const { isDarkMode } = useAuth();
  const messages = {
    all:      "No documents yet. Upload your first PDF to get started.",
    draft:    "No drafts. Documents you haven't sent yet will appear here.",
    pending:  "Nothing pending. Documents waiting on a signature will appear here.",
    signed:   "No signed documents yet.",
    rejected: "No rejected documents. 🎉",
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-[#252836]" : "bg-gray-100"}`}>
        <span className="text-2xl">📄</span>
      </div>
      <p className={`text-sm max-w-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
        {messages[filter] || messages.all}
      </p>
    </div>
  );
}
