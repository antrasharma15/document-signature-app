import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, Settings, LogOut, Pen } from "lucide-react";

const S = {
  sidebar: "#3D4127",   // Dark forest green
  accent: "#636B2F",    // Medium moss green
  text: "#3D4127",
  muted: "#BAC095",     // Soft light green
};

export default function Sidebar() {
  const { user, logout, isDarkMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { Icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { Icon: Settings, label: "Settings", path: "/settings" },
  ];

  const currentTheme = isDarkMode ? {
    sidebar: "#0F111A",
    accent: "#528E7E",
    text: "#F3F4F6",
    muted: "#9CA3AF",
  } : S;

  const firstLetter = (user?.name || "U").substring(0, 1).toUpperCase();

  return (
    <aside style={{
      width: 240, minWidth: 240, background: currentTheme.sidebar,
      display: "flex", flexDirection: "column", height: "100vh"
    }}>
      {/* Logo */}
      <div style={{ padding: "22px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={() => navigate("/dashboard")} className="cursor-pointer">
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: currentTheme.accent,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Pen size={16} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>
              EASYsign
            </div>
            <div style={{ color: currentTheme.muted, fontSize: 10, fontWeight: 500, marginTop: 1 }}>
              Signatures Made Easy!
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
        <p style={{
          margin: "0 0 8px", padding: "0 10px", fontSize: 10, fontWeight: 700,
          color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase"
        }}>
          Menu
        </p>
        {navItems.map(({ Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                width: "100%", border: "none", cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8, marginBottom: 2,
                background: active ? currentTheme.accent : "transparent",
                color: active ? "#fff" : currentTheme.muted,
                fontSize: 13, fontWeight: active ? 600 : 400,
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* User card */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{
          background: "rgba(255,255,255,0.04)", borderRadius: 10,
          padding: "10px 12px", display: "flex", alignItems: "center", gap: 10
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: currentTheme.accent,
            flexShrink: 0, display: "flex", alignItems: "center",
            justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13
          }}>
            {firstLetter}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#ffffff", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "User"}
            </div>
            <div style={{ color: currentTheme.muted, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email || "Email"}
            </div>
          </div>
          <LogOut size={14} color={currentTheme.muted} style={{ cursor: "pointer", flexShrink: 0 }} onClick={handleLogout} />
        </div>
      </div>
    </aside>
  );
}
