import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";

export default function DocumentCard({ doc, onSelect }) {
  const uploadedDate = new Date(doc.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div
      onClick={onSelect}
      className="group block bg-white rounded-xl border border-gray-200 p-4
                 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
    >
      {/* PDF icon + filename */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-red-550/10 flex items-center justify-center text-red-500 text-xs font-bold">
            PDF
          </div>
          <p className="text-sm font-medium text-gray-800 truncate">
            {doc.originalName || doc.filename}
          </p>
        </div>
      </div>

      {/* Status + date */}
      <div className="flex items-center justify-between">
        <StatusBadge status={doc.status} />
        <span className="text-xs text-gray-400">{uploadedDate}</span>
      </div>
    </div>
  );
}
