import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { useAuth } from "../context/AuthContext";

export default function DocumentCard({ doc, onSelect }) {
  const { isDarkMode } = useAuth();
  const uploadedDate = new Date(doc.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div
      onClick={onSelect}
      className={`group block rounded-xl border p-4 transition-all cursor-pointer ${
        isDarkMode
          ? "bg-[#1A1D2B] border-[#2D3142] hover:border-[#528E7E] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
          : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md"
      }`}
    >
      {/* PDF icon + filename */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-red-550/10 flex items-center justify-center text-red-500 text-xs font-bold">
            PDF
          </div>
          <p className={`text-sm font-medium truncate ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
            {doc.originalName || doc.filename}
          </p>
        </div>
      </div>

      {/* Status + date */}
      <div className="flex items-center justify-between">
        <StatusBadge status={doc.status} />
        <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{uploadedDate}</span>
      </div>
    </div>
  );
}
