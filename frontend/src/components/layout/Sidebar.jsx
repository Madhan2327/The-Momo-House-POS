import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Package,
  Boxes,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { colors, fonts } from "../../styles/theme";
import logo from "../../assets/images/logo.png";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Billing", path: "/billing", icon: Receipt },
  { label: "Products", path: "/products", icon: Package },
  { label: "Stock", path: "/stock", icon: Boxes },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose, isMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleNav = (path) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 40,
          }}
        />
      )}

      <aside
        style={{
          position: isMobile ? "fixed" : "sticky",
          top: 0,
          left: 0,
          height: "100vh",
          width: "260px",
          background: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          transform: isMobile ? `translateX(${isOpen ? "0" : "-100%"})` : "none",
          transition: "transform 0.25s ease",
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "22px 20px",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: colors.bg,
              border: `1px solid ${colors.borderStrong}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: "14px", color: colors.text, margin: 0, textTransform: "uppercase", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
              Momo House
            </p>
            <p style={{ fontFamily: fonts.body, fontSize: "10px", color: colors.red, margin: 0, textTransform: "uppercase", letterSpacing: "0.15em" }}>
              POS Admin
            </p>
          </div>

          {isMobile && (
            <button
              onClick={onClose}
              aria-label="Close menu"
              style={{ marginLeft: "auto", background: "none", border: "none", color: colors.muted, cursor: "pointer", display: "flex", padding: "4px" }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => handleNav(path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: active ? colors.red : "transparent",
                  color: active ? colors.cream : colors.muted,
                  fontFamily: fonts.body,
                  fontSize: "14px",
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = colors.redSoft;
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${colors.border}` }}>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "100%",
              padding: "11px 14px",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              color: colors.muted,
              fontFamily: fonts.body,
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.red)}
            onMouseLeave={(e) => (e.currentTarget.style.color = colors.muted)}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}