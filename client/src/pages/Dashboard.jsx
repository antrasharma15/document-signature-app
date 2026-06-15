import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API, { API_BASE_URL } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import PDFSignatureEditor from "./PDFSignatureEditor";
import StatusBadge from "../components/StatusBadge";
import FilterTabs from "../components/FilterTabs";
import DocumentCard from "../components/DocumentCard";
import EmptyState from "../components/EmptyState";
import {
  LayoutDashboard, FileText, Send, Clock, ShieldCheck,
  Settings, Upload, Search, Bell, CheckCircle,
  AlertCircle, Eye, MoreHorizontal, Plus, LogOut,
  ChevronDown, ArrowUpRight, Inbox, Pen
} from "lucide-react";

/* ─── Design tokens ─────────────────────────────────────────────── */
const S = {
  bg:          "#BAC095",   // mossy hollow background
  sidebar:     "#1C1F2E",   // ink blue-black, richer than generic dark
  card:        "#FFFFFF",
  accent:      "#3D6B5E",   // verdigris — aged copper seal
  accentLight: "#EBF3F0",
  text:        "#1C1F2E",
  muted:       "#6E7491",
  border:      "#E2E4EA",
  status: {
    signed:   { bg: "#EBF3F0", color: "#2A5C4E" },
    waiting:  { bg: "#EEF0F9", color: "#3D4D8A" },
    pending:  { bg: "#FEF3E2", color: "#A85E0D" },
    rejected: { bg: "#FCEEE9", color: "#A83620" },
    draft:    { bg: "#F0F0F7", color: "#6E7491" },
  },
};

// Sidebar NAV items have been refactored into a shared Sidebar component.

const FILTERS = [
  { id:"all",      label:"All"      },
  { id:"draft",    label:"Drafts"   },
  { id:"pending",  label:"Pending"  },
  { id:"signed",   label:"Signed"   },
  { id:"rejected", label:"Rejected" },
];

/* ─── Helper functions ──────────────────────────────────────────── */
function formatBytes(bytes, decimals = 1) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatTimeAgo(dateString) {
  if (!dateString) return "unknown";
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 0) return "just now";
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " yr" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " mo" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " day" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " hr" + (interval > 1 ? "s" : "") + " ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " min" + (interval > 1 ? "s" : "") + " ago";
  if (seconds < 10) return "just now";
  return Math.floor(seconds) + " sec ago";
}

function getSignersText(doc) {
  switch (doc.status) {
    case "draft": return "Draft (Not sent)";
    case "pending": return doc.signerEmail ? `Awaiting ${doc.signerEmail}` : "Pending";
    case "waiting": return doc.signerEmail ? `Awaiting ${doc.signerEmail}` : "Pending";
    case "signed": return doc.signerEmail ? `Signed by ${doc.signerEmail}` : "Completed";
    case "rejected": return doc.signerEmail ? `Rejected by ${doc.signerEmail}` : "Rejected";
    default: return doc.status;
  }
}

/* ─── StatusBadge ───────────────────────────────────────────────── */
function Badge({ status }) {
  const labels = { signed:"Signed", waiting:"Pending", pending:"Pending", rejected:"Rejected", draft:"Draft" };
  const { bg, color } = S.status[status] || S.status.pending;
  return (
    <span style={{ background:bg, color, fontSize:11, fontWeight:600,
                   padding:"3px 10px", borderRadius:20, whiteSpace:"nowrap",
                   letterSpacing:"0.02em" }}>
      {labels[status] || status}
    </span>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────── */
export default function Dashboard() {
  const [filter, setFilter] = useState("all");
  const [drag,   setDrag  ] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [signerEmail, setSignerEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSendForSigning = async (docId) => {
    if (!signerEmail) return alert("Enter signer's email");
    try {
      setSending(true);
      await API.post(`/signatures/send/${docId}`, { signerEmail });
      alert(`✅ Signing link sent to ${signerEmail}`);
      setSignerEmail("");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send link");
    } finally {
      setSending(false);
    }
  };

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch documents from server
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/docs");
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get("docId");
    if (docId && documents.length > 0) {
      const doc = documents.find(d => d._id === docId);
      if (doc) {
        setActiveDoc(doc);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [documents]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploading(true);
      await API.post("/docs/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      // Fetch latest document list
      const res = await API.get("/docs");
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    document.getElementById("file-input").click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDrag(true);
  };

  const handleDragLeave = () => {
    setDrag(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Compute counts for each filter tab
  const counts = useMemo(() => {
    const c = { all: documents.length, draft: 0, pending: 0, signed: 0, rejected: 0, waiting: 0 };
    documents.forEach((doc) => {
      if (doc.status === "draft") c.draft++;
      else if (doc.status === "signed") c.signed++;
      else if (doc.status === "rejected") c.rejected++;
      else if (doc.status === "pending" || doc.status === "waiting") {
        if (doc.signerEmail && doc.signerEmail !== user?.email) {
          c.waiting++;
        } else {
          c.pending++;
        }
      }
    });
    return c;
  }, [documents, user]);

  // Filter documents based on active tab and search query
  const docs = useMemo(() => {
    let list = documents;
    if (filter !== "all") {
      if (filter === "waiting") {
        list = documents.filter((doc) => (doc.status === "pending" || doc.status === "waiting") && doc.signerEmail && doc.signerEmail !== user?.email);
      } else if (filter === "pending") {
        list = documents.filter((doc) => (doc.status === "pending" || doc.status === "waiting") && (!doc.signerEmail || doc.signerEmail === user?.email));
      } else {
        list = documents.filter((doc) => doc.status === filter);
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((doc) =>
        (doc.originalName || doc.filename || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [documents, filter, searchQuery, user]);

  // Dynamic statistics calculations
  const pendingCount = counts.pending;
  const signedCount = counts.signed;
  const rejectedCount = counts.rejected;
  const totalCount = counts.all;

  const statsData = [
    { label:"Pending Signature",  value:pendingCount,  bg:S.status.pending.bg,  color:S.status.pending.color,  Icon:Clock        },
    { label:"Rejected",           value:rejectedCount, bg:S.status.rejected.bg, color:S.status.rejected.color, Icon:AlertCircle  },
    { label:"Completed",          value:signedCount,   bg:S.status.signed.bg,   color:S.status.signed.color,   Icon:CheckCircle  },
    { label:"Total Documents",    value:totalCount,    bg:"#F0F0F7",             color:S.muted,                 Icon:FileText     },
  ];

  // Dynamic activity log generation from documents
  const activities = [];
  documents.forEach(doc => {
    activities.push({
      label: "You uploaded",
      doc: doc.originalName.length > 20 ? doc.originalName.substring(0, 17) + "..." : doc.originalName,
      time: formatTimeAgo(doc.createdAt),
      timestamp: new Date(doc.createdAt).getTime()
    });
    if (doc.status === "signed") {
      activities.push({
        label: "You signed",
        doc: doc.originalName.length > 20 ? doc.originalName.substring(0, 17) + "..." : doc.originalName,
        time: formatTimeAgo(doc.updatedAt),
        timestamp: new Date(doc.updatedAt).getTime()
      });
    } else if (doc.status === "rejected") {
      activities.push({
        label: "Rejected:",
        doc: doc.originalName.length > 20 ? doc.originalName.substring(0, 17) + "..." : doc.originalName,
        time: formatTimeAgo(doc.updatedAt),
        timestamp: new Date(doc.updatedAt).getTime()
      });
    }
  });

  const sortedActivities = activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 4);

  const card = { background:S.card, borderRadius:12, border:`1px solid ${S.border}` };

  const firstLetter = (user?.name || "U").substring(0, 1).toUpperCase();

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden",
                  fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  background:S.bg, fontSize:14 }}>

      {/* ════════════ SIDEBAR ════════════ */}
      <Sidebar />

      {/* ════════════ MAIN CONTENT ════════════ */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Top bar */}
        <header style={{ background:S.card, borderBottom:`1px solid ${S.border}`,
                         height:58, padding:"0 22px", flexShrink:0,
                         display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8,
                        background:S.bg, borderRadius:8, padding:"7px 12px",
                        flex:1, maxWidth:300 }}>
            <Search size={14} color={S.muted} />
            <input
              placeholder="Search documents…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border:"none", background:"transparent", outline:"none",
                fontSize:13, color:S.text, width:"100%",
              }}
            />
          </div>
          <div style={{ flex:1 }} />

          {/* User chip */}
          <div style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer",
                        padding:"5px 10px", borderRadius:8, border:`1px solid ${S.border}` }}>
            <div style={{ width:28, height:28, borderRadius:"50%",
                          background:S.accentLight, border:`2px solid ${S.accent}`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          color:S.accent, fontWeight:700, fontSize:12 }}>
              {firstLetter}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:S.text, lineHeight:1.3 }}>
                {user?.name || "User"}
              </div>
              <div style={{ fontSize:10, color:S.muted }}>
                {user?.email || "Email"}
              </div>
            </div>
            <ChevronDown size={13} color={S.muted} />
          </div>
        </header>

        {/* ─── Scrollable body ─── */}
        <div style={{ flex:1, overflowY:"auto", padding:"22px 22px 40px" }}>

          {/* Welcome + action buttons */}
          <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"flex-start", marginBottom:22 }}>
            <div>
              <h1 style={{ margin:0, fontSize:21, fontWeight:700, color:S.text,
                           letterSpacing:"-0.02em" }}>
                Good morning, {user?.name || "User"} 
              </h1>
              <p style={{ margin:"4px 0 0", fontSize:13, color:S.muted }}>
                You have{" "}
                <span style={{ color:"#C97C2A", fontWeight:600 }}>{pendingCount} documents</span>
                {" "}pending signature.
              </p>
            </div>
            <div style={{ display:"flex", gap:10, flexShrink:0 }}>
              {/* <button style={{
                display:"flex", alignItems:"center", gap:6, padding:"8px 15px",
                borderRadius:8, border:`1.5px solid ${S.border}`,
                background:S.card, color:S.text, fontSize:13, fontWeight:500, cursor:"pointer",
              }}>
                <Send size={13} /> Send for Signature
              </button> */}
              <button onClick={triggerFileInput} style={{
                display:"flex", alignItems:"center", gap:6, padding:"8px 18px",
                borderRadius:8, border:"none", background:S.accent, color:"#fff",
                fontSize:13, fontWeight:600, cursor:"pointer",
              }}>
                <Plus size={14} /> {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
            {statsData.map(({ label, value, bg, color, Icon }) => (
              <div key={label} style={{ ...card, padding:"16px 18px",
                                        display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:42, height:42, borderRadius:10, background:bg, flexShrink:0,
                              display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontSize:26, fontWeight:700, color:S.text, lineHeight:1 }}>
                    {value}
                  </div>
                  <div style={{ fontSize:11, color:S.muted, marginTop:4 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 290px", gap:18 }}>

            {/* ── Documents table ── */}
            <div style={{ ...card, overflow:"hidden" }}>

              {/* Table header */}
              <div style={{ padding:"16px 20px 0",
                            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:S.text }}>
                     Your Recent Documents
                  </h2>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:S.muted }}>
                    {documents.length} documents in your vault
                  </p>
                </div>
                {/* <button style={{ display:"flex", alignItems:"center", gap:4, fontSize:12,
                                 color:S.accent, fontWeight:600, background:"none",
                                 border:"none", cursor:"pointer" }}>
                  View all <ArrowUpRight size={12} />
                </button> */}
              </div>

              {/* Filter tabs */}
              <div style={{ padding:"16px 20px 8px", borderBottom:`1px solid ${S.border}` }}>
                <FilterTabs activeFilter={filter} onChange={setFilter} counts={counts} />
              </div>

              {/* Document grid */}
              {loading ? (
                <div style={{ padding:"40px", textAlign:"center", color:S.muted }}>
                  Loading documents...
                </div>
              ) : error ? (
                <div style={{ padding:"40px", textAlign:"center", color:"#A83620" }}>
                  {error}
                </div>
              ) : docs.length === 0 ? (
                <EmptyState filter={filter} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                  {docs.map((doc) => (
                    <DocumentCard
                      key={doc._id}
                      doc={doc}
                      onSelect={() => setActiveDoc(doc)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Right column ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Upload widget */}
              <div style={{ ...card, padding:"16px 18px" }}>
                <h3 style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:S.text }}>
                  Upload Document
                </h3>
                <input
                  type="file"
                  id="file-input"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  style={{
                    border:`2px dashed ${drag ? S.accent : S.border}`,
                    borderRadius:10, padding:"22px 14px", textAlign:"center",
                    background: drag ? S.accentLight : "#FAFBFC",
                    cursor:"pointer", transition:"all 0.2s",
                  }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:S.accentLight,
                                margin:"0 auto 10px",
                                display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Upload size={18} color={S.accent} />
                  </div>
                  <p style={{ margin:"0 0 3px", fontSize:13, fontWeight:600, color:S.text }}>
                    {uploading ? "Uploading PDF..." : "Drop PDF here"}
                  </p>
                  <p style={{ margin:0, fontSize:12, color:S.muted }}>
                    or{" "}
                    <span style={{ color:S.accent, fontWeight:600, cursor:"pointer" }}>
                      browse files
                    </span>
                  </p>
                  <p style={{ margin:"6px 0 0", fontSize:10, color:"#B0B5C9" }}>
                    PDF only · Max 10 MB
                  </p>
                </div>
              </div>

              {/* Audit / Activity */}
              <div style={{ ...card, padding:"16px 18px", flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                              alignItems:"center", marginBottom:14 }}>
                  <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:S.text }}>
                    Recent Activity
                  </h3>
                  <button style={{ fontSize:11, color:S.accent, fontWeight:600,
                                   background:"none", border:"none", cursor:"pointer" }}>
                    Full log →
                  </button>
                </div>

                {/* Timeline */}
                <div style={{ display:"flex", flexDirection:"column" }}>
                  {sortedActivities.length === 0 ? (
                    <div style={{ fontSize:12, color:S.muted, textAlign:"center", padding:"20px 0" }}>
                      No recent activity yet!
                    </div>
                  ) : (
                    sortedActivities.map((item, i) => (
                      <div key={i} style={{ display:"flex", gap:10, position:"relative" }}>
                        {i < sortedActivities.length - 1 && (
                          <div style={{ position:"absolute", left:11, top:22, bottom:-4,
                                        width:1, background:S.border }} />
                        )}
                        <div style={{ width:22, height:22, borderRadius:"50%",
                                      background:S.accentLight, flexShrink:0, marginTop:2,
                                      display:"flex", alignItems:"center", justifyContent:"center",
                                      zIndex:1 }}>
                          <ShieldCheck size={11} color={S.accent} />
                        </div>
                        <div style={{ paddingBottom: i < sortedActivities.length - 1 ? 14 : 0, flex:1 }}>
                          <p style={{ margin:0, fontSize:12, color:S.text, lineHeight:1.5 }}>
                            <span style={{ fontWeight:500 }}>{item.label}</span>{" "}
                            <span style={{ color:S.accent, fontWeight:600 }}>"{item.doc}"</span>
                          </p>
                          <p style={{ margin:"2px 0 0", fontSize:10, color:S.muted }}>{item.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ════════════ DOCUMENT WORKSPACE MODAL ════════════ */}
      {activeDoc && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(28, 31, 46, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "20px",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            width: "100%",
            maxWidth: 1200,
            height: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 24px",
              borderBottom: `1px solid ${S.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#FAFBFD"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: S.text }}>
                  Document Workspace — {activeDoc.originalName || activeDoc.filename}
                </h3>
              </div>
              <button
                onClick={() => { setActiveDoc(null); fetchDocuments(); }}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: S.muted,
                  padding: 8,
                }}
              >
                ✕ Close Workspace
              </button>
            </div>
            {/* Modal Body */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <PDFSignatureEditor
                fileId={activeDoc._id}
                onClose={() => { setActiveDoc(null); fetchDocuments(); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
