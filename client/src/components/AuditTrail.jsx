import { useEffect, useState } from "react";
import API from "../api/axios";

// Action labels and colors for display
const ACTION_META = {
  DOCUMENT_UPLOADED:      { label: "Document Uploaded",       color: "bg-blue-100 text-blue-700" },
  SIGNING_LINK_SENT:      { label: "Signing Link Sent",        color: "bg-yellow-100 text-yellow-700" },
  DOCUMENT_VIEWED:        { label: "Document Viewed by Signer",color: "bg-purple-100 text-purple-700" },
  DOCUMENT_SIGNED:        { label: "Document Signed",          color: "bg-green-100 text-green-700" },
  DOCUMENT_REJECTED:      { label: "Document Rejected",        color: "bg-red-100 text-red-700" },
  SIGNED_PDF_DOWNLOADED:  { label: "Signed PDF Downloaded",    color: "bg-gray-100 text-gray-700" },
};

export default function AuditTrail({ docId }) {
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
  }, [docId]);

  if (loading) return <p className="text-gray-400 text-sm">Loading audit trail...</p>;
  if (!logs || !logs.length) return <p className="text-gray-400 text-sm">No activity yet.</p>;

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <h3 className="text-lg font-semibold mb-3 text-slate-800">Audit Trail</h3>
      <div className="relative border-l-2 border-gray-200 pl-4 space-y-4">
        {logs.map((log) => {
          const meta = ACTION_META[log.action] || { label: log.action, color: "bg-gray-100 text-gray-600" };
          return (
            <div key={log._id} className="relative">
              {/* Timeline dot */}
              <span className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-indigo-400 border-2 border-white" />

              <div className="flex flex-col gap-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${meta.color}`}>
                  {meta.label}
                </span>
                <p className="text-sm text-gray-600">
                  By: <span className="font-medium">{log.performedBy}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(log.createdAt).toLocaleString()} — IP: {log.ipAddress}
                </p>
                {/* Show metadata if present */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="text-xs text-gray-500 bg-slate-50 rounded p-2 mt-1 border border-slate-100 font-mono overflow-x-auto">
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
