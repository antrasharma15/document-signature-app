import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import SignaturePlacer from "../components/SignaturePlacer";
import {
  LayoutDashboard, FileText, Send, Clock, ShieldCheck,
  Settings, Upload, Search, Bell, CheckCircle,
  AlertCircle, Eye, MoreHorizontal, Plus, LogOut,
  ChevronDown, ArrowUpRight, Inbox, Pen
} from "lucide-react";

/* ─── Design tokens ─────────────────────────────────────────────── */
const S = {
  bg:          "#ECEDF2",   // cool lavender-grey, NOT warm cream
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
  },
};

const NAV = [
  { Icon: LayoutDashboard, label:"Dashboard",          id:"dashboard"                },
  { Icon: FileText,        label:"My Documents",       id:"documents"                },
  { Icon: Send,            label:"Send for Sign",      id:"send"                     },
  { Icon: Inbox,           label:"Waiting for Others", id:"waiting"                  },
  { Icon: ShieldCheck,     label:"Audit Trail",        id:"audit"                    },
  { Icon: Settings,        label:"Settings",           id:"settings"                 },
];

const FILTERS = [
  { id:"all",      label:"All"             },
  { id:"pending",  label:"Action Required" },
  { id:"waiting",  label:"Waiting"         },
  { id:"signed",   label:"Signed"          },
  { id:"rejected", label:"Rejected"        },
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

function getSignersText(status) {
  switch (status) {
    case "signed": return "You (Completed)";
    case "pending": return "Awaiting your sign";
    case "rejected": return "Rejected";
    case "waiting": return "Waiting for others";
    default: return "Awaiting your sign";
  }
}

/* ─── StatusBadge ───────────────────────────────────────────────── */
function Badge({ status }) {
  const labels = { signed:"Signed", waiting:"Waiting", pending:"Action Required", rejected:"Rejected" };
  const { bg, color } = S.status[status] || S.status.pending;
  return (
    <span style={{ background:bg, color, fontSize:11, fontWeight:600,
                   padding:"3px 10px", borderRadius:20, whiteSpace:"nowrap",
                   letterSpacing:"0.02em" }}>
      {labels[status] || "Action Required"}
    </span>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────── */
export default function Dashboard() {
  const [nav,    setNav   ] = useState("dashboard");
  const [filter, setFilter] = useState("all");
  const [drag,   setDrag  ] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);

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

  const docs = filter === "all" ? documents : documents.filter(d => d.status === filter);

  // Dynamic statistics calculations
  const pendingCount = documents.filter(d => d.status === "pending").length;
  const waitingCount = documents.filter(d => d.status === "waiting").length;
  const signedCount = documents.filter(d => d.status === "signed").length;
  const totalCount = documents.length;

  const statsData = [
    { label:"Action Required",    value:pendingCount,  bg:S.status.pending.bg,  color:S.status.pending.color,  Icon:AlertCircle  },
    { label:"Waiting for Others", value:waitingCount,  bg:S.status.waiting.bg,  color:S.status.waiting.color,  Icon:Clock        },
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
      <aside style={{ width:240, minWidth:240, background:S.sidebar,
                      display:"flex", flexDirection:"column", height:"100vh" }}>

        {/* Logo */}
        <div style={{ padding:"22px 18px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:S.accent,
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Pen size={16} color="#fff" />
            </div>
            <div>
              <div style={{ color:"#fff", fontWeight:700, fontSize:16, letterSpacing:"-0.01em" }}>
                SignVault
              </div>
              <div style={{ color:"#404968", fontSize:10, fontWeight:500, marginTop:1 }}>
                Document Platform
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex:1, padding:"14px 10px", overflowY:"auto" }}>
          <p style={{ margin:"0 0 8px", padding:"0 10px", fontSize:10, fontWeight:700,
                      color:"#353D58", letterSpacing:"0.08em", textTransform:"uppercase" }}>
            Menu
          </p>
          {NAV.map(({ Icon, label, id }) => {
            const active = nav === id;
            const badgeValue = id === "waiting" ? waitingCount : undefined;
            return (
              <button key={id} onClick={() => setNav(id)} style={{
                width:"100%", border:"none", cursor:"pointer", textAlign:"left",
                display:"flex", alignItems:"center", gap:10,
                padding:"9px 12px", borderRadius:8, marginBottom:2,
                background: active ? S.accent : "transparent",
                color:      active ? "#fff"    : "#8B94B2",
                fontSize:13, fontWeight: active ? 600 : 400,
                transition:"all 0.15s ease",
              }}>
                <Icon size={16} />
                <span style={{ flex:1 }}>{label}</span>
                {badgeValue !== undefined && badgeValue > 0 && (
                  <span style={{ background: active ? "rgba(255,255,255,0.2)" : "#242B40",
                                 color:      active ? "#fff" : "#6B758E",
                                 fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:20 }}>
                    {badgeValue}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User card */}
        <div style={{ padding:"12px 10px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:10,
                        padding:"10px 12px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:S.accent,
                          flexShrink:0, display:"flex", alignItems:"center",
                          justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13 }}>
              {firstLetter}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:"#DADEE8", fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user?.name || "User"}
              </div>
              <div style={{ color:"#404968", fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user?.email || "Email"}
              </div>
            </div>
            <LogOut size={14} color="#404968" style={{ cursor:"pointer", flexShrink:0 }} onClick={handleLogout} />
          </div>
        </div>
      </aside>

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
            <input placeholder="Search documents…" style={{
              border:"none", background:"transparent", outline:"none",
              fontSize:13, color:S.text, width:"100%",
            }} />
          </div>
          <div style={{ flex:1 }} />

          {/* Bell */}
          <button style={{ position:"relative", width:36, height:36, borderRadius:8,
                           background:S.bg, border:"none", cursor:"pointer",
                           display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Bell size={16} color={S.muted} />
            <span style={{ position:"absolute", top:8, right:8, width:7, height:7,
                           borderRadius:"50%", background:"#C97C2A", border:"1.5px solid #fff" }} />
          </button>

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
                Good morning, {user?.name || "User"} 👋
              </h1>
              <p style={{ margin:"4px 0 0", fontSize:13, color:S.muted }}>
                You have{" "}
                <span style={{ color:"#C97C2A", fontWeight:600 }}>{pendingCount} documents</span>
                {" "}awaiting your signature.
              </p>
            </div>
            <div style={{ display:"flex", gap:10, flexShrink:0 }}>
              <button style={{
                display:"flex", alignItems:"center", gap:6, padding:"8px 15px",
                borderRadius:8, border:`1.5px solid ${S.border}`,
                background:S.card, color:S.text, fontSize:13, fontWeight:500, cursor:"pointer",
              }}>
                <Send size={13} /> Send for Signature
              </button>
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
                    Recent Documents
                  </h2>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:S.muted }}>
                    {documents.length} documents in your vault
                  </p>
                </div>
                <button style={{ display:"flex", alignItems:"center", gap:4, fontSize:12,
                                 color:S.accent, fontWeight:600, background:"none",
                                 border:"none", cursor:"pointer" }}>
                  View all <ArrowUpRight size={12} />
                </button>
              </div>

              {/* Filter tabs */}
              <div style={{ padding:"10px 20px 0", display:"flex", gap:2,
                            borderBottom:`1px solid ${S.border}` }}>
                {FILTERS.map(({ id, label }) => {
                  const active = filter === id;
                  return (
                    <button key={id} onClick={() => setFilter(id)} style={{
                      padding:"7px 12px", border:"none", cursor:"pointer", fontSize:12,
                      fontWeight: active ? 600 : 400,
                      background: active ? S.accentLight : "transparent",
                      color:      active ? S.accent      : S.muted,
                      borderRadius:"6px 6px 0 0",
                      borderBottom: active ? `2px solid ${S.accent}` : "2px solid transparent",
                      marginBottom:-1,
                    }}>
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Table / Loader / Error / Empty state */}
              {loading ? (
                <div style={{ padding:"40px", textAlign:"center", color:S.muted }}>
                  Loading documents...
                </div>
              ) : error ? (
                <div style={{ padding:"40px", textAlign:"center", color:"#A83620" }}>
                  {error}
                </div>
              ) : docs.length === 0 ? (
                <div style={{ padding:"40px", textAlign:"center", color:S.muted }}>
                  No documents found. Upload a PDF to get started!
                </div>
              ) : (
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#FAFBFC" }}>
                      {["Document","Status","Signers","Updated",""].map(h => (
                        <th key={h} style={{
                          padding:"10px 18px", textAlign:"left",
                          fontSize:10, fontWeight:700, color:S.muted,
                          letterSpacing:"0.05em", textTransform:"uppercase",
                          borderBottom:`1px solid ${S.border}`,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((doc, i) => (
                      <tr key={doc._id}
                          style={{ borderBottom: i < docs.length - 1 ? `1px solid ${S.border}` : "none",
                                   transition:"background 0.1s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#FAFBFD"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                        {/* Name + size */}
                        <td style={{ padding:"13px 18px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:30, height:36, borderRadius:5,
                                          background:S.accentLight, flexShrink:0,
                                          display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <FileText size={14} color={S.accent} />
                            </div>
                            <div>
                              <div style={{ fontSize:13, fontWeight:500, color:S.text,
                                            maxWidth:200, overflow:"hidden",
                                            textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {doc.originalName}
                              </div>
                              <div style={{ fontSize:11, color:S.muted, marginTop:1 }}>
                                {formatBytes(doc.fileSize)}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding:"13px 18px" }}><Badge status={doc.status} /></td>
                        <td style={{ padding:"13px 18px", fontSize:12, color:S.muted }}>
                          {getSignersText(doc.status)}
                        </td>
                        <td style={{ padding:"13px 18px", fontSize:12, color:S.muted, whiteSpace:"nowrap" }}>
                          {new Date(doc.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Actions */}
                        <td style={{ padding:"13px 18px" }}>
                          <div style={{ display:"flex", gap:6 }}>
                            <button
                              onClick={() => navigate(`/editor/${doc._id}`)}
                              style={{
                                display:"flex", alignItems:"center", gap:4,
                                padding:"4px 10px", borderRadius:6,
                                border:`1px solid ${S.border}`, background:"transparent",
                                cursor:"pointer", fontSize:11, color:S.text, fontWeight:500,
                              }}
                            >
                              <Pen size={11} color={S.accent} /> Open Editor
                            </button>
                            <button
                              onClick={() => setActiveDoc(doc)}
                              style={{
                                display:"flex", alignItems:"center", gap:4,
                                padding:"4px 10px", borderRadius:6,
                                border:`1px solid ${S.border}`, background:"transparent",
                                cursor:"pointer", fontSize:11, color:S.text, fontWeight:500,
                              }}
                            >
                              <Eye size={11} /> View
                            </button>
                            <button style={{
                              padding:"4px 7px", borderRadius:6, border:`1px solid ${S.border}`,
                              background:"transparent", cursor:"pointer",
                              display:"flex", alignItems:"center",
                            }}>
                              <MoreHorizontal size={12} color={S.muted} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      No recent activity
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

      {/* ════════════ DOCUMENT VIEWER MODAL ════════════ */}
      {activeDoc && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(28, 31, 46, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "20px",
          animation: "fadeIn 0.2s ease",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 16,
            width: "100%",
            maxWidth: 920,
            maxHeight: "90vh",
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
                  {activeDoc.originalName}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: S.muted }}>
                  Size: {formatBytes(activeDoc.fileSize)}
                </p>
              </div>
              <button
                onClick={() => { setActiveDoc(null); fetchDocuments(); }}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 20,
                  cursor: "pointer",
                  color: S.muted,
                  padding: 8,
                  lineHeight: 1,
                  transition: "color 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#1C1F2E"}
                onMouseLeave={e => e.currentTarget.style.color = S.muted}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px" }}>
              <SignaturePlacer
                fileId={activeDoc._id}
                fileUrl={`http://localhost:5000/uploads/${activeDoc.fileName}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
