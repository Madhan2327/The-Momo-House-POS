import { useState, useEffect } from "react";
import { Menu, Bell, User } from "lucide-react";
import { colors, fonts } from "../../styles/theme";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/billing": "Billing",
  "/products": "Products",
  "/stock": "Stock",
  "/reports": "Reports",
  "/settings": "Settings",
};

export default function Header({ onMenuClick, isMobile, pathname }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const title = PAGE_TITLES[pathname] || "Dashboard";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        padding: isMobile ? "14px 16px" : "16px 28px",
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
        {isMobile && (
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            style={{ background: "none", border: "none", color: colors.text, cursor: "pointer", display: "flex", padding: "4px", flexShrink: 0 }}
          >
            <Menu size={22} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: isMobile ? "16px" : "19px", fontWeight: 700, color: colors.text, margin: 0, whiteSpace: "nowrap" }}>
            {title}
          </h1>
          {!isMobile && (
            <p style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.muted, margin: "2px 0 0" }}>
              {dateStr} &nbsp;·&nbsp; {timeStr}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "18px", flexShrink: 0 }}>
        <button
          aria-label="Notifications"
          style={{
            position: "relative",
            background: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
            borderRadius: "10px",
            width: "38px",
            height: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.muted,
            cursor: "pointer",
          }}
        >
          <Bell size={18} />
          <span
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              width: "7px",
              height: "7px",
              borderRadius: "9999px",
              background: colors.red,
            }}
          />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "9999px",
              background: colors.red,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.cream,
              flexShrink: 0,
            }}
          >
            <User size={18} />
          </div>
          {!isMobile && (
            <div>
              <p style={{ fontFamily: fonts.body, fontSize: "13px", fontWeight: 600, color: colors.text, margin: 0 }}>Admin</p>
              <p style={{ fontFamily: fonts.body, fontSize: "11px", color: colors.muted, margin: 0 }}>Owner</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}