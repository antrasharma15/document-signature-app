import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { User, Lock, Bell, Moon, Shield, Save, CheckCircle2, AlertCircle } from "lucide-react";

const S = {
  bg: "#BAC095",
  card: "#FFFFFF",
  accent: "#3D6B5E",
  accentLight: "#EBF3F0",
  text: "#1C1F2E",
  muted: "#6E7491",
  border: "#E2E4EA",
};

export default function SettingsPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Mock settings state
  const [emailNotif, setEmailNotif] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const res = await API.put("/auth/profile", profileForm);
      // Update local storage and auth context user info
      login(res.data.user, localStorage.getItem("token"));
      setProfileMessage({ type: "success", text: "Profile updated successfully ✓" });
    } catch (err) {
      console.error(err);
      setProfileMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      setPasswordLoading(false);
      return;
    }

    try {
      await API.put("/auth/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage({ type: "success", text: "Password changed successfully ✓" });
    } catch (err) {
      console.error(err);
      setPasswordMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to change password",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const firstLetter = (user?.name || "U").substring(0, 1).toUpperCase();
  const cardStyle = {
    background: S.card,
    borderRadius: 12,
    border: `1px solid ${S.border}`,
    padding: "24px",
    marginBottom: "20px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: `1px solid ${S.border}`,
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    color: S.text,
    background: "#FAFBFC",
    transition: "border-color 0.15s ease",
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: S.muted,
    marginBottom: 6,
  };

  const btnStyle = (disabled) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    background: disabled ? "#D1D5DB" : S.accent,
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s ease",
  });

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: S.bg,
      fontSize: 14
    }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <header style={{
          background: S.card,
          borderBottom: `1px solid ${S.border}`,
          height: 58,
          padding: "0 22px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: S.text }}>
            Account Settings
          </h2>

          {/* User chip */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px",
            borderRadius: 8,
            border: `1px solid ${S.border}`
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: S.accentLight,
              border: `2px solid ${S.accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: S.accent,
              fontWeight: 700,
              fontSize: 12
            }}>
              {firstLetter}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: S.text, lineHeight: 1.3 }}>
                {user?.name || "User"}
              </div>
              <div style={{ fontSize: 10, color: S.muted }}>
                {user?.email || "Email"}
              </div>
            </div>
          </div>
        </header>

        {/* Settings Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 48px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>

            {/* Profile Card */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <User size={18} color={S.accent} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: S.text }}>
                  Profile Information
                </h3>
              </div>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: S.muted }}>
                Update your name and email address. You will instantly see these changes updated in EASYsign.
              </p>

              {profileMessage && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: profileMessage.type === "success" ? "#EBF3F0" : "#FCEEE9",
                  color: profileMessage.type === "success" ? "#2A5C4E" : "#A83620",
                  fontSize: 12,
                  marginBottom: 16,
                  fontWeight: 500,
                  border: `1px solid ${profileMessage.type === "success" ? "#C6DFD5" : "#F5D0C5"}`
                }}>
                  {profileMessage.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" disabled={profileLoading} style={btnStyle(profileLoading)}>
                    <Save size={14} />
                    {profileLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Card */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <Lock size={18} color={S.accent} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: S.text }}>
                  Change Password
                </h3>
              </div>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: S.muted }}>
                To secure your account, choose a strong password with at least 6 characters.
              </p>

              {passwordMessage && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: passwordMessage.type === "success" ? "#EBF3F0" : "#FCEEE9",
                  color: passwordMessage.type === "success" ? "#2A5C4E" : "#A83620",
                  fontSize: 12,
                  marginBottom: 16,
                  fontWeight: 500,
                  border: `1px solid ${passwordMessage.type === "success" ? "#C6DFD5" : "#F5D0C5"}`
                }}>
                  {passwordMessage.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    style={inputStyle}
                    required
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" disabled={passwordLoading} style={btnStyle(passwordLoading)}>
                    <Lock size={14} />
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>

            {/* Notification & Display Preferences Card */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <Bell size={18} color={S.accent} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: S.text }}>
                  Preferences
                </h3>
              </div>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: S.muted }}>
                Customize your notifications and interface preferences. (Mock controls)
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 14,
                  borderBottom: `1px solid ${S.border}`
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: S.text, fontSize: 13 }}>Email Notifications</div>
                    <div style={{ fontSize: 11, color: S.muted }}>Receive an email when someone requests your signature.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: S.accent }}
                  />
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 14,
                  borderBottom: `1px solid ${S.border}`
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: S.text, fontSize: 13 }}>Weekly Status Updates</div>
                    <div style={{ fontSize: 11, color: S.muted }}>Get weekly reports on pending and completed documents.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklySummary}
                    onChange={(e) => setWeeklySummary(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: S.accent }}
                  />
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: S.text, fontSize: 13 }}>Dark Mode</div>
                    <div style={{ fontSize: 11, color: S.muted }}>Toggle dark theme layout (Simulation only).</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={(e) => setIsDarkMode(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: S.accent }}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
