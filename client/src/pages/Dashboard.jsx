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
  bg:          "#F3F4F6",   // light gray background
  sidebar:     "#1E293B",   // slate-800
  card:        "#FFFFFF",
  accent:      "#2563EB",   // primary blue #2563EB
  accentLight: "#EFF6FF",   // light blue-50
  text:        "#111827",   // gray-900
  muted:       "#4B5563",   // gray-600
  border:      "#E5E7EB",   // gray-200
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
  const { isDarkMode } = useAuth();
  const labels = { signed:"Signed", waiting:"Pending", pending:"Pending", rejected:"Rejected", draft:"Draft" };
  
  const statusTheme = isDarkMode ? {
    signed:   { bg: "#1F3A30", color: "#62C4A5" },
    waiting:  { bg: "#232A45", color: "#95A4FC" },
    pending:  { bg: "#3D2E1A", color: "#FBBF24" },
    rejected: { bg: "#3B1E1A", color: "#F87171" },
    draft:    { bg: "#2E2E38", color: "#9CA3AF" },
  } : S.status;
  
  const { bg, color } = statusTheme[status] || statusTheme.pending;
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
  const [menuOpen, setMenuOpen] = useState(false);

  const { user, logout, isDarkMode } = useAuth();
  const navigate = useNavigate();

  const currentTheme = {
    bg:          isDarkMode ? "#0F172A" : S.bg,
    sidebar:     isDarkMode ? "#0F172A" : S.sidebar,
    card:        isDarkMode ? "#1E293B" : S.card,
    accent:      isDarkMode ? "#3B82F6" : S.accent,
    accentLight: isDarkMode ? "#1E3A8A" : S.accentLight,
    text:        isDarkMode ? "#F3F4F6" : S.text,
    muted:       isDarkMode ? "#94A3B8" : S.muted,
    border:      isDarkMode ? "#334155" : S.border,
  };

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
    { label:"Pending Signature",  value:pendingCount,  bg: isDarkMode ? "#3D2E1A" : S.status.pending.bg,  color: isDarkMode ? "#FBBF24" : S.status.pending.color,  Icon:Clock        },
    { label:"Rejected",           value:rejectedCount, bg: isDarkMode ? "#3B1E1A" : S.status.rejected.bg, color: isDarkMode ? "#F87171" : S.status.rejected.color, Icon:AlertCircle  },
    { label:"Completed",          value:signedCount,   bg: isDarkMode ? "#1F3A30" : S.status.signed.bg,   color: isDarkMode ? "#62C4A5" : S.status.signed.color,   Icon:CheckCircle  },
    { label:"Total Documents",    value:totalCount,    bg: isDarkMode ? "#252836" : "#F0F0F7",             color: currentTheme.muted,                 Icon:FileText     },
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

  const card = { background:currentTheme.card, borderRadius:12, border:`1px solid ${currentTheme.border}` };

  const firstLetter = (user?.name || "U").substring(0, 1).toUpperCase();

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden",
                  fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  background:currentTheme.bg, fontSize:14 }}>

      {/* ════════════ SIDEBAR ════════════ */}
      <Sidebar />

      {/* ════════════ MAIN CONTENT ════════════ */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Top bar */}
        <header style={{ background:currentTheme.card, borderBottom:`1px solid ${currentTheme.border}`,
                         height:58, padding:"0 22px", flexShrink:0,
                         display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8,
                        background:isDarkMode ? "#202330" : S.bg, borderRadius:8, padding:"7px 12px",
                        flex:1, maxWidth:300 }}>
            <Search size={14} color={currentTheme.muted} />
            <input
              placeholder="Search documents…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border:"none", background:"transparent", outline:"none",
                fontSize:13, color:currentTheme.text, width:"100%",
              }}
            />
          </div>
          <div style={{ flex:1 }} />

          {/* User chip */}
          <div style={{ position: "relative" }}>
            <div 
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer",
                            padding:"5px 10px", borderRadius:8, border:`1px solid ${currentTheme.border}` }}
            >
              <div style={{ width:28, height:28, borderRadius:"50%",
                            background:currentTheme.accentLight, border:`2px solid ${currentTheme.accent}`,
                            display:"flex", alignItems:"center", justifyIntent:"center", justifyContent:"center",
                            color:currentTheme.accent, fontWeight:700, fontSize:12 }}>
                {firstLetter}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:currentTheme.text, lineHeight:1.3 }}>
                  {user?.name || "User"}
                </div>
                <div style={{ fontSize:10, color:currentTheme.muted }}>
                  {user?.email || "Email"}
                </div>
              </div>
              <ChevronDown size={13} color={currentTheme.muted} />
            </div>

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                <div 
                  onClick={() => setMenuOpen(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 99, cursor: "default" }}
                />
                <div style={{
                  position: "absolute",
                  top: "110%",
                  right: 0,
                  background: currentTheme.card,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: 8,
                  boxShadow: isDarkMode ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 12px rgba(0,0,0,0.08)",
                  zIndex: 100,
                  width: 160,
                  padding: "4px 0",
                }}>
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 12px",
                      border: "none",
                      background: "transparent",
                      color: currentTheme.text,
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? "#252836" : "#F3F4F6"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Settings size={14} color={currentTheme.muted} />
                    Settings
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 12px",
                      border: "none",
                      background: "transparent",
                      color: "#EF4444",
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? "#3B1E1A" : "#FEE2E2"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <LogOut size={14} color="#EF4444" />
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* ─── Scrollable body ─── */}
        <div style={{ flex:1, overflowY:"auto", padding:"22px 22px 40px" }}>

          {/* Welcome + action buttons */}
          <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"flex-start", marginBottom:22 }}>
            <div>
              <h1 style={{ margin:0, fontSize:21, fontWeight:700, color:currentTheme.text,
                           letterSpacing:"-0.02em" }}>
                Good morning, {user?.name || "User"} 
              </h1>
              <p style={{ margin:"4px 0 0", fontSize:13, color:currentTheme.muted }}>
                You have{" "}
                <span style={{ color:"#C97C2A", fontWeight:600 }}>{pendingCount} documents</span>
                {" "}pending signature.
              </p>
            </div>
            <div style={{ display:"flex", gap:10, flexShrink:0 }}>
              <button onClick={triggerFileInput} style={{
                display:"flex", alignItems:"center", gap:6, padding:"8px 18px",
                borderRadius:8, border:"none", background:currentTheme.accent, color:"#fff",
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
                  <div style={{ fontSize:26, fontWeight:700, color:currentTheme.text, lineHeight:1 }}>
                    {value}
                  </div>
                  <div style={{ fontSize:11, color:currentTheme.muted, marginTop:4 }}>{label}</div>
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
                  <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:currentTheme.text }}>
                     Your Recent Documents
                  </h2>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:currentTheme.muted }}>
                    {documents.length} documents in your vault
                  </p>
                </div>
              </div>

              {/* Filter tabs */}
              <div style={{ padding:"16px 20px 8px", borderBottom:`1px solid ${currentTheme.border}` }}>
                <FilterTabs activeFilter={filter} onChange={setFilter} counts={counts} />
              </div>

              {/* Document grid */}
              {loading ? (
                <div style={{ padding:"40px", textAlign:"center", color:currentTheme.muted }}>
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
                <h3 style={{ margin:"0 0 12px", fontSize:14, fontWeight:700, color:currentTheme.text }}>
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
                    border:`2px dashed ${drag ? currentTheme.accent : currentTheme.border}`,
                    borderRadius:10, padding:"22px 14px", textAlign:"center",
                    background: drag ? currentTheme.accentLight : (isDarkMode ? "#202330" : "#FAFBFC"),
                    cursor:"pointer", transition:"all 0.2s",
                  }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:currentTheme.accentLight,
                                margin:"0 auto 10px",
                                display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Upload size={18} color={currentTheme.accent} />
                  </div>
                  <p style={{ margin:"0 0 3px", fontSize:13, fontWeight:600, color:currentTheme.text }}>
                    {uploading ? "Uploading PDF..." : "Drop PDF here"}
                  </p>
                  <p style={{ margin:0, fontSize:12, color:currentTheme.muted }}>
                    or{" "}
                    <span style={{ color:currentTheme.accent, fontWeight:600, cursor:"pointer" }}>
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
                  <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:currentTheme.text }}>
                    Recent Activity
                  </h3>
                  <button style={{ fontSize:11, color:currentTheme.accent, fontWeight:600,
                                   background:"none", border:"none", cursor:"pointer" }}>
                    Full log →
                  </button>
                </div>

                {/* Timeline */}
                <div style={{ display:"flex", flexDirection:"column" }}>
                  {sortedActivities.length === 0 ? (
                    <div style={{ fontSize:12, color:currentTheme.muted, textAlign:"center", padding:"20px 0" }}>
                      No recent activity yet!
                    </div>
                  ) : (
                    sortedActivities.map((item, i) => (
                      <div key={i} style={{ display:"flex", gap:10, position:"relative" }}>
                        {i < sortedActivities.length - 1 && (
                          <div style={{ position:"absolute", left:11, top:22, bottom:-4,
                                        width:1, background:currentTheme.border }} />
                        )}
                        <div style={{ width:22, height:22, borderRadius:"50%",
                                      background:currentTheme.accentLight, flexShrink:0, marginTop:2,
                                      display:"flex", alignItems:"center", justifyContent:"center",
                                      zIndex:1 }}>
                          <ShieldCheck size={11} color={currentTheme.accent} />
                        </div>
                        <div style={{ paddingBottom: i < sortedActivities.length - 1 ? 14 : 0, flex:1 }}>
                          <p style={{ margin:0, fontSize:12, color:currentTheme.text, lineHeight:1.5 }}>
                            <span style={{ fontWeight:500 }}>{item.label}</span>{" "}
                            <span style={{ color:currentTheme.accent, fontWeight:600 }}>"{item.doc}"</span>
                          </p>
                          <p style={{ margin:"2px 0 0", fontSize:10, color:currentTheme.muted }}>{item.time}</p>
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
            background: isDarkMode ? "#1A1D2B" : "#fff",
            borderRadius: 16,
            width: "100%",
            maxWidth: 1200,
            height: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: isDarkMode ? "0 10px 40px rgba(0,0,0,0.5)" : "0 10px 30px rgba(0,0,0,0.25)",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 24px",
              borderBottom: `1px solid ${currentTheme.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: isDarkMode ? "#141622" : "#FAFBFD"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: currentTheme.text }}>
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
                  color: currentTheme.muted,
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
