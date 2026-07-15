import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/images/logo.png";

const colors = {
  bg: "#0d0d0d",
  surface: "#1a1a1a",
  red: "#d81f2a",
  redHover: "#b81b24",
  redLine: "rgba(216,31,42,0.35)",
  cream: "#f7f3ec",
  muted: "#8a8280",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [btnHover, setBtnHover] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 420px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (await login(username, password)) {
      navigate("/dashboard");
    } else {
      setError("Invalid username or password");
    }
  };

  const sidePad = isMobile ? "22px" : "40px";

  const inputStyle = {
    width: "100%",
    height: "56px",
    borderRadius: "12px",
    background: "#0d0d0d",
    border: `1px solid ${colors.redLine}`,
    paddingLeft: "48px",
    paddingRight: "16px",
    color: colors.cream,
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    fontSize: "16px", // 16px minimum prevents iOS auto-zoom on focus
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: colors.muted,
    marginBottom: "6px",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Inter:wght@400;500;600&display=swap');

        .momo-input:focus {
          border-color: ${colors.red} !important;
          box-shadow: 0 0 0 3px rgba(216,31,42,0.25);
        }
        .momo-icon-btn:focus-visible {
          outline: 2px solid ${colors.red};
          outline-offset: 2px;
          border-radius: 4px;
        }
        .momo-submit:focus-visible {
          outline: 2px solid ${colors.cream};
          outline-offset: 3px;
        }
        .momo-submit:active {
          transform: scale(0.98);
        }

        @keyframes steamRise {
          0%   { transform: translateY(0) scaleX(1);   opacity: 0; }
          15%  { opacity: 0.6; }
          80%  { opacity: 0.15; }
          100% { transform: translateY(-26px) scaleX(1.15); opacity: 0; }
        }
        .steam-wisp { animation: steamRise 3.6s ease-in-out infinite; transform-origin: bottom center; }
        .steam-wisp:nth-child(2) { animation-delay: 1.1s; }
        .steam-wisp:nth-child(3) { animation-delay: 2.2s; }

        @media (prefers-reduced-motion: reduce) {
          .steam-wisp { animation: none; opacity: 0.25; }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          width: "560px",
          height: "560px",
          background: colors.red,
          opacity: 0.08,
          filter: "blur(140px)",
          borderRadius: "9999px",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          background: colors.surface,
          border: `1px solid ${colors.redLine}`,
          borderRadius: isMobile ? "16px" : "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(216,31,42,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            paddingTop: isMobile ? "32px" : "44px",
            paddingBottom: isMobile ? "22px" : "28px",
            paddingLeft: sidePad,
            paddingRight: sidePad,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: isMobile ? "92px" : "116px",
              height: isMobile ? "92px" : "116px",
              marginBottom: isMobile ? "16px" : "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              style={{ position: "absolute", top: isMobile ? "-18px" : "-22px", width: isMobile ? "30px" : "36px", height: isMobile ? "22px" : "28px" }}
              viewBox="0 0 40 32"
              aria-hidden="true"
            >
              <path className="steam-wisp" d="M6 30C6 20 14 20 14 10" stroke={colors.red} strokeWidth="2" fill="none" strokeLinecap="round" />
              <path className="steam-wisp" d="M20 30C20 20 28 20 28 10" stroke={colors.red} strokeWidth="2" fill="none" strokeLinecap="round" />
              <path className="steam-wisp" d="M13 30C13 20 21 20 21 10" stroke={colors.red} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>

            <svg
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              viewBox="0 0 116 116"
              aria-hidden="true"
            >
              <circle cx="58" cy="58" r="55" fill="none" stroke={colors.red} strokeWidth="2.5"
                strokeDasharray="120 30" strokeLinecap="round" transform="rotate(-90 58 58)" />
              <circle cx="58" cy="58" r="47" fill="none" stroke={colors.cream} strokeWidth="1" opacity="0.15" />
            </svg>

            <div
              style={{
                position: "relative",
                background: "#0d0d0d",
                borderRadius: "9999px",
                padding: "8px",
                border: `1px solid ${colors.redLine}`,
              }}
            >
              <img
                src={logo}
                alt="The Momo House"
                style={{ width: isMobile ? "54px" : "68px", height: isMobile ? "54px" : "68px", objectFit: "contain", borderRadius: "9999px" }}
              />
            </div>
          </div>

          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              textAlign: "center",
              fontSize: isMobile ? "21px" : "26px",
              fontWeight: 900,
              color: colors.cream,
              letterSpacing: "0.01em",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            The Momo House
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
            <span style={{ width: "14px", height: "1px", background: colors.redLine }} />
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: colors.red,
                margin: 0,
              }}
            >
              Admin Portal
            </p>
            <span style={{ width: "14px", height: "1px", background: colors.redLine }} />
          </div>
        </div>

        <div style={{ paddingLeft: sidePad, paddingRight: sidePad }}>
          <div style={{ borderTop: `1px solid ${colors.redLine}` }} />
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          style={{
            fontFamily: "'Inter', sans-serif",
            paddingTop: isMobile ? "26px" : "36px",
            paddingBottom: isMobile ? "28px" : "40px",
            paddingLeft: sidePad,
            paddingRight: sidePad,
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div>
            <label htmlFor="username" style={labelStyle}>Username</label>
            <div style={{ position: "relative" }}>
              <User
                size={20}
                style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.red }}
              />
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                inputMode="text"
                className="momo-input"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock
                size={20}
                style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: colors.red }}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="momo-input"
                style={{ ...inputStyle, paddingRight: "48px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="momo-icon-btn"
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: colors.muted,
                  cursor: "pointer",
                  display: "flex",
                  padding: "4px", // slightly larger tap target on mobile
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" style={{ display: "flex", alignItems: "center", gap: "6px", color: colors.red, fontSize: "14px", margin: 0 }}>
              <AlertCircle size={15} />
              {error}
            </p>
          )}

          <button
            type="submit"
            className="momo-submit"
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              width: "100%",
              height: "56px",
              borderRadius: "12px",
              background: btnHover ? colors.redHover : colors.red,
              color: colors.cream,
              fontWeight: 700,
              fontSize: "16px",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              boxShadow: btnHover
                ? "0 10px 28px rgba(216,31,42,0.45)"
                : "0 8px 24px rgba(216,31,42,0.3)",
              transition: "all 0.2s",
              marginTop: "4px",
            }}
          >
            Log in
          </button>
        </form>

        <div style={{ display: "flex", justifyContent: "center", paddingBottom: isMobile ? "18px" : "24px" }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", color: colors.muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Steamed with love
          </span>
        </div>
      </div>
    </div>
  );
}