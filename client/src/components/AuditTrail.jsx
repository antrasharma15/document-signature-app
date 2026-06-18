import { useEffect, useState } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

// Action labels and colors for display
const ACTION_META_LIGHT = {
  DOCUMENT_UPLOADED:      { label: "Document Uploaded",       color: "bg-blue-100 text-blue-700" },
  SIGNING_LINK_SENT:      { label: "Signing Link Sent",        color: "bg-yellow-100 text-yellow-700" },
  DOCUMENT_VIEWED:        { label: "Document Viewed by Signer",color: "bg-purple-100 text-purple-700" },
  DOCUMENT_SIGNED:        { label: "Document Signed",          color: "bg-green-100 text-green-700" },
  DOCUMENT_REJECTED:      { label: "Document Rejected",        color: "bg-red-100 text-red-700" },
  SIGNED_PDF_DOWNLOADED:  { label: "Signed PDF Downloaded",    color: "bg-gray-100 text-gray-700" },
};

const ACTION_META_DARK = {
  DOCUMENT_UPLOADED:      { label: "Document Uploaded",       color: "bg-blue-900/40 text-blue-300" },
  SIGNING_LINK_SENT:      { label: "Signing Link Sent",        color: "bg-yellow-900/40 text-yellow-300" },
  DOCUMENT_VIEWED:        { label: "Document Viewed by Signer",color: "bg-purple-900/40 text-purple-300" },
  DOCUMENT_SIGNED:        { label: "Document Signed",          color: "bg-green-900/40 text-emerald-300" },
  DOCUMENT_REJECTED:      { label: "Document Rejected",        color: "bg-red-900/40 text-red-300" },
  SIGNED_PDF_DOWNLOADED:  { label: "Signed PDF Downloaded",    color: "bg-gray-800 text-gray-300" },
};

export default function AuditTrail({ docId, refreshTrigger }) {
  const { isDarkMode } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    API
      .get(`/audit/${docId}`)
      .then((res) => {
        setLogs(res.data.logs || []);
      })
      .catch((err) => console.error("Audit fetch failed:", err))
      .finally(() => setLoading(false));
  }, [docId, refreshTrigger]);

  if (loading) return <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Loading audit trail...</p>;
  if (!logs || !logs.length) return <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>No activity yet.</p>;

  const actionMeta = isDarkMode ? ACTION_META_DARK : ACTION_META_LIGHT;

  return (
    <div className={`mt-6 border-t pt-6 ${isDarkMode ? "border-[#2D3142]" : "border-gray-100"}`}>
      <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? "text-gray-200" : "text-slate-800"}`}>Audit Trail</h3>
      <div className={`relative border-l-2 pl-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        {logs.map((log) => {
          const meta = actionMeta[log.action] || { label: log.action, color: isDarkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600" };
          return (
            <div key={log._id} className="relative">
              {/* Timeline dot */}
              <span className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-indigo-400 border-2 ${isDarkMode ? "border-[#1A1D2B]" : "border-white"}`} />

              <div className="flex flex-col gap-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${meta.color}`}>
                  {meta.label}
                </span>
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  By: <span className="font-medium">{log.performedBy}</span>
                </p>
                <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {new Date(log.createdAt).toLocaleString()} — IP: {log.ipAddress}
                </p>
                {/* Show metadata if present */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className={`text-xs rounded p-2 mt-1 border font-mono overflow-x-auto ${
                    isDarkMode
                      ? "bg-[#202330] text-gray-400 border-[#2D3142]"
                      : "bg-slate-50 text-gray-500 border-slate-100"
                  }`}>
                    {JSON.stringify(log.metadata, null, 2)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
