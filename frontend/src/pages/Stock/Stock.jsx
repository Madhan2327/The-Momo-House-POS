import { useState, useEffect, useMemo } from "react";
import {
  Boxes,
  AlertTriangle,
  Loader2,
  Search,
  Plus,
  Check,
} from "lucide-react";
import { colors, fonts } from "../../styles/theme";
import { api } from "../../api/client";

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | low

  const [restockAmounts, setRestockAmounts] = useState({}); // {productId: "10"}
  const [savingId, setSavingId] = useState(null);
  const [justSavedId, setJustSavedId] = useState(null);
  const [rowError, setRowError] = useState({});

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const lowStockCount = products.filter((p) => p.stock <= p.low_stock_threshold).length;

  const filteredProducts = useMemo(() => {
    let list = products;
    if (filter === "low") {
      list = list.filter((p) => p.stock <= p.low_stock_threshold);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, search, filter]);

  async function handleRestock(product) {
    const amountStr = restockAmounts[product.id];
    const amount = Number(amountStr);

    if (!amount || amount <= 0) {
      setRowError({ ...rowError, [product.id]: "Enter a quantity" });
      return;
    }

    setSavingId(product.id);
    setRowError({ ...rowError, [product.id]: "" });

    try {
      const updated = await api.updateProduct(product.id, {
        stock: product.stock + amount,
      });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      setRestockAmounts({ ...restockAmounts, [product.id]: "" });
      setJustSavedId(product.id);
      setTimeout(() => setJustSavedId((id) => (id === product.id ? null : id)), 1500);
    } catch (err) {
      setRowError({ ...rowError, [product.id]: err.message || "Failed to update" });
    } finally {
      setSavingId(null);
    }
  }

  const cardStyle = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: "14px",
    padding: "18px",
  };

  if (loading && products.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: colors.muted, gap: "10px" }}>
        <Loader2 size={20} className="animate-spin" />
        <span style={{ fontFamily: fonts.body, fontSize: "14px" }}>Loading stock…</span>
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "9px",
              background: `${colors.muted}1A`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Boxes size={18} color={colors.muted} />
          </div>
          <p style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 700, color: colors.text, margin: 0 }}>
            Stock
          </p>
        </div>

        {/* Filter toggle */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: `1px solid ${filter === "all" ? colors.red : colors.border}`,
              background: filter === "all" ? colors.redSoft : "transparent",
              color: filter === "all" ? colors.red : colors.muted,
              fontFamily: fonts.body,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setFilter("low")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: `1px solid ${filter === "low" ? colors.red : colors.border}`,
              background: filter === "low" ? colors.redSoft : "transparent",
              color: filter === "low" ? colors.red : colors.muted,
              fontFamily: fonts.body,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <AlertTriangle size={13} />
            Low Stock ({lowStockCount})
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: isMobile ? "100%" : "320px" }}>
        <Search
          size={16}
          color={colors.muted}
          style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          style={{
            width: "100%",
            background: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
            borderRadius: "10px",
            padding: "10px 12px 10px 36px",
            fontFamily: fonts.body,
            fontSize: "13px",
            color: colors.text,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Stock table */}
      <div style={cardStyle}>
        {filteredProducts.length === 0 ? (
          <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.muted, textAlign: "center", padding: "40px 0" }}>
            {products.length === 0 ? "No products yet — add some from the Products page first." : "No products match your search."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
              <thead>
                <tr>
                  {["Name", "Category", "Current Stock", "Low Stock At", "Status", "Restock"].map((h) => (
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
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= p.low_stock_threshold;
                  const saving = savingId === p.id;
                  const justSaved = justSavedId === p.id;
                  return (
                    <tr key={p.id}>
                      <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "13px", color: colors.text, fontWeight: 500 }}>
                        {p.name}
                      </td>
                      <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "13px", color: colors.muted }}>
                        {p.category}
                      </td>
                      <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "14px", color: colors.text, fontWeight: 700 }}>
                        {p.stock}
                      </td>
                      <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "13px", color: colors.muted }}>
                        {p.low_stock_threshold}
                      </td>
                      <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}` }}>
                        <span
                          style={{
                            fontFamily: fonts.body,
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 10px",
                            borderRadius: "9999px",
                            background: isLow ? "rgba(216,31,42,0.15)" : "rgba(46,160,67,0.15)",
                            color: isLow ? colors.red : colors.success,
                          }}
                        >
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 0", borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={restockAmounts[p.id] || ""}
                            onChange={(e) =>
                              setRestockAmounts({ ...restockAmounts, [p.id]: e.target.value })
                            }
                            style={{
                              width: "70px",
                              background: colors.surfaceAlt,
                              border: `1px solid ${colors.border}`,
                              borderRadius: "6px",
                              padding: "7px 8px",
                              fontFamily: fonts.body,
                              fontSize: "12px",
                              color: colors.text,
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                          <button
                            onClick={() => handleRestock(p)}
                            disabled={saving}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              background: justSaved ? colors.success : colors.red,
                              color: colors.cream,
                              border: "none",
                              borderRadius: "6px",
                              padding: "7px 10px",
                              fontFamily: fonts.body,
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: saving ? "default" : "pointer",
                              opacity: saving ? 0.7 : 1,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {saving ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : justSaved ? (
                              <Check size={12} />
                            ) : (
                              <Plus size={12} />
                            )}
                            {justSaved ? "Added" : "Add"}
                          </button>
                        </div>
                        {rowError[p.id] && (
                          <p style={{ fontFamily: fonts.body, fontSize: "11px", color: colors.red, margin: "4px 0 0" }}>
                            {rowError[p.id]}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
