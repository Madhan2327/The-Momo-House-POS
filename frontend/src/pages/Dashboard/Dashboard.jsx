import { useState, useEffect } from "react";
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Package,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { colors, fonts } from "../../styles/theme";
import { api } from "../../api/client";

export default function Dashboard() {
  const [isMobile, setIsMobile] = useState(false);
  const [summary, setSummary] = useState(null);
  const [chart, setChart] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [s, c, r, b] = await Promise.all([
          api.getDashboardSummary(),
          api.getDashboardChart(),
          api.getRecentBills(),
          api.getBestSellers(),
        ]);
        if (!cancelled) {
          setSummary(s);
          setChart(c);
          setRecentBills(r);
          setBestSellers(b);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    // Refresh every 60s so figures stay current while the screen is left open
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const cardStyle = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: "14px",
    padding: "18px",
  };

  if (loading && !summary) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: colors.muted, gap: "10px" }}>
        <Loader2 size={20} className="animate-spin" />
        <span style={{ fontFamily: fonts.body, fontSize: "14px" }}>Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "10px", color: colors.red }}>
        <AlertTriangle size={18} />
        <span style={{ fontFamily: fonts.body, fontSize: "14px" }}>{error}</span>
      </div>
    );
  }

  const STATS = [
    { label: "Today's Sales", value: `₹${summary.todaysSales.toLocaleString("en-IN")}`, icon: IndianRupee, tint: colors.red },
    { label: "Today's Orders", value: String(summary.todaysOrders), icon: ShoppingBag, tint: colors.warning },
    { label: "Today's Profit", value: `₹${summary.todaysProfit.toLocaleString("en-IN")}`, icon: TrendingUp, tint: colors.success },
    { label: "Total Products", value: String(summary.totalProducts), icon: Package, tint: colors.muted },
    { label: "Low Stock Items", value: String(summary.lowStockItems), icon: AlertTriangle, tint: colors.red },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)",
          gap: "14px",
        }}
      >
        {STATS.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} style={cardStyle}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "9px",
                background: `${tint}1A`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
              }}
            >
              <Icon size={18} color={tint} />
            </div>
            <p style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.muted, margin: "0 0 4px" }}>{label}</p>
            <p style={{ fontFamily: fonts.display, fontSize: isMobile ? "18px" : "22px", fontWeight: 700, color: colors.text, margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart + Best sellers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
          gap: "14px",
        }}
      >
        <div style={cardStyle}>
          <p style={{ fontFamily: fonts.body, fontSize: "14px", fontWeight: 600, color: colors.text, margin: "0 0 18px" }}>
            Sales — Last 7 Days
          </p>
          {chart.length === 0 || chart.every((d) => d.total === 0) ? (
            <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.muted, textAlign: "center", padding: "40px 0" }}>
              No sales recorded yet this week.
            </p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "160px" }}>
              {chart.map((d, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%", justifyContent: "flex-end" }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${Math.max(d.pct, 2)}%`,
                      borderRadius: "6px 6px 0 0",
                      background: `linear-gradient(180deg, ${colors.red}, ${colors.redHover})`,
                    }}
                    title={`₹${d.total}`}
                  />
                  <span style={{ fontFamily: fonts.body, fontSize: "11px", color: colors.muted }}>{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <p style={{ fontFamily: fonts.body, fontSize: "14px", fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>
            Best Selling Products
          </p>
          {bestSellers.length === 0 ? (
            <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.muted, textAlign: "center", padding: "20px 0" }}>
              No sales yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {bestSellers.map((p) => (
                <div key={p.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.text }}>{p.name}</span>
                    <span style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.muted }}>{p.sold} sold</span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "9999px", background: colors.surfaceAlt, overflow: "hidden" }}>
                    <div style={{ width: `${p.pct}%`, height: "100%", background: colors.red }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent bills */}
      <div style={cardStyle}>
        <p style={{ fontFamily: fonts.body, fontSize: "14px", fontWeight: 600, color: colors.text, margin: "0 0 14px" }}>
          Recent Bills
        </p>
        {recentBills.length === 0 ? (
          <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.muted, textAlign: "center", padding: "20px 0" }}>
            No bills yet — they'll show up here once Billing is in use.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
              <thead>
                <tr>
                  {["Bill No.", "Customer", "Items", "Amount", "Time", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        fontFamily: fonts.body,
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: colors.muted,
                        padding: "0 12px 10px 0",
                        borderBottom: `1px solid ${colors.border}`,
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBills.map((bill) => (
                  <tr key={bill.id}>
                    <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "13px", color: colors.text }}>
                      {bill.id}
                    </td>
                    <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "13px", color: colors.text }}>
                      {bill.customer}
                    </td>
                    <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "13px", color: colors.text }}>
                      {bill.items}
                    </td>
                    <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "13px", color: colors.text, fontWeight: 600 }}>
                      ₹{bill.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "13px", color: colors.muted }}>
                      {bill.time}
                    </td>
                    <td style={{ padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}>
                      <span
                        style={{
                          fontFamily: fonts.body,
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "9999px",
                          background: bill.status === "Paid" ? "rgba(46,160,67,0.15)" : "rgba(212,160,23,0.15)",
                          color: bill.status === "Paid" ? colors.success : colors.warning,
                        }}
                      >
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
