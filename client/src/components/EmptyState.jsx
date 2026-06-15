export default function EmptyState({ filter }) {
  const messages = {
    all:      "No documents yet. Upload your first PDF to get started.",
    draft:    "No drafts. Documents you haven't sent yet will appear here.",
    pending:  "Nothing pending. Documents waiting on a signature will appear here.",
    signed:   "No signed documents yet.",
    rejected: "No rejected documents. 🎉",
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <span className="text-2xl">📄</span>
      </div>
      <p className="text-gray-500 text-sm max-w-xs">
        {messages[filter] || messages.all}
      </p>
    </div>
  );
}
