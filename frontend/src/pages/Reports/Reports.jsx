import { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Loader2,
  AlertTriangle,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Minus,
  Trash2,
  X,
  Check,
  Search,
} from "lucide-react";
import { colors, fonts } from "../../styles/theme";
import { api } from "../../api/client";

const RANGE_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "week", label: "Last 7 Days" },
  { key: "month", label: "Last 30 Days" },
  { key: "all", label: "All Time" },
];

function isInRange(dateStr, range) {
  const date = new Date(dateStr);
  const now = new Date();
  if (range === "all") return true;
  if (range === "today") {
    return date.toDateString() === now.toDateString();
  }
  const days = range === "week" ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

export default function Reports() {
  const [bills, setBills] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [range, setRange] = useState("week");
  const [expandedId, setExpandedId] = useState(null);

  // Editing state
  const [editingBillId, setEditingBillId] = useState(null);
  const [editCustomer, setEditCustomer] = useState("");
  const [editItems, setEditItems] = useState([]); // [{product_id, name, price, cost, qty}]
  const [addProductSearch, setAddProductSearch] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [billsData, productsData] = await Promise.all([api.getBills(), api.getProducts()]);
      setBills(billsData);
      setProducts(productsData);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredBills = useMemo(() => {
    return bills
      .filter((b) => isInRange(b.created_at, range))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [bills, range]);

  const summary = useMemo(() => {
    const totalSales = filteredBills.reduce((sum, b) => sum + b.amount, 0);
    const totalProfit = filteredBills.reduce((sum, b) => sum + b.profit, 0);
    const totalOrders = filteredBills.length;

    const productTotals = {};
    filteredBills.forEach((b) => {
      (b.items || []).forEach((item) => {
        productTotals[item.name] = (productTotals[item.name] || 0) + item.qty;
      });
    });
    const topProducts = Object.entries(productTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { totalSales, totalProfit, totalOrders, topProducts };
  }, [filteredBills]);

  function startEdit(bill) {
    setEditingBillId(bill.id);
    setExpandedId(bill.id);
    setEditCustomer(bill.customer || "");
    setEditItems(
      (bill.items || []).map((item) => ({
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        cost: item.cost,
        qty: item.qty,
      }))
    );
    setAddProductSearch("");
    setEditError("");
  }

  function cancelEdit() {
    setEditingBillId(null);
    setEditItems([]);
    setEditError("");
  }

  function changeEditQty(index, delta) {
    setEditItems((prev) =>
      prev
        .map((item, i) => {
          if (i !== index) return item;
          const nextQty = item.qty + delta;
          if (nextQty <= 0) return null;
          return { ...item, qty: nextQty };
        })
        .filter(Boolean)
    );
  }

  function removeEditItem(index) {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addProductToEdit(product) {
    setEditItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          cost: product.cost,
          qty: 1,
        },
      ];
    });
  }

  const editTotal = editItems.reduce((sum, item) => sum + item.qty * item.price, 0);

  const availableProductsForAdd = useMemo(() => {
    const q = addProductSearch.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [products, addProductSearch]);

  async function saveEdit(billId) {
    if (editItems.length === 0) {
      setEditError("A bill needs at least one item.");
      return;
    }
    setSavingEdit(true);
    setEditError("");
    try {
      await api.updateBill(billId, {
        customer: editCustomer.trim() || "Walk-in",
        items: editItems.map((item) => ({
          product_id: item.product_id,
          name: item.name,
          qty: item.qty,
          price: item.price,
          cost: item.cost,
        })),
      });
      setEditingBillId(null);
      setEditItems([]);
      await loadData();
    } catch (err) {
      setEditError(err.message || "Failed to save changes");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(bill) {
    if (!window.confirm(`Delete bill ${bill.bill_number}? This will restore its stock and cannot be undone.`)) return;
    setDeletingId(bill.id);
    try {
      await api.deleteBill(bill.id);
      await loadData();
      if (expandedId === bill.id) setExpandedId(null);
      if (editingBillId === bill.id) cancelEdit();
    } catch (err) {
      alert(err.message || "Failed to delete bill");
    } finally {
      setDeletingId(null);
    }
  }

  const cardStyle = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: "14px",
    padding: "18px",
  };

  const inputStyle = {
    width: "100%",
    background: colors.surfaceAlt,
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    padding: "8px 10px",
    fontFamily: fonts.body,
    fontSize: "13px",
    color: colors.text,
    outline: "none",
    boxSizing: "border-box",
  };

  if (loading && bills.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: colors.muted, gap: "10px" }}>
        <Loader2 size={20} className="animate-spin" />
        <span style={{ fontFamily: fonts.body, fontSize: "14px" }}>Loading reports…</span>
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
            <BarChart3 size={18} color={colors.muted} />
          </div>
          <p style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 700, color: colors.text, margin: 0 }}>
            Reports
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setRange(opt.key)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: `1px solid ${range === opt.key ? colors.red : colors.border}`,
                background: range === opt.key ? colors.redSoft : "transparent",
                color: range === opt.key ? colors.red : colors.muted,
                fontFamily: fonts.body,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
          gap: "14px",
        }}
      >
        {[
          { label: "Total Sales", value: `₹${summary.totalSales.toLocaleString("en-IN")}`, icon: IndianRupee, tint: colors.red },
          { label: "Total Profit", value: `₹${summary.totalProfit.toLocaleString("en-IN")}`, icon: TrendingUp, tint: colors.success },
          { label: "Total Orders", value: String(summary.totalOrders), icon: ShoppingBag, tint: colors.warning },
        ].map(({ label, value, icon: Icon, tint }) => (
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

      {/* Top products in range */}
      <div style={cardStyle}>
        <p style={{ fontFamily: fonts.body, fontSize: "14px", fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>
          Top Products — {RANGE_OPTIONS.find((o) => o.key === range)?.label}
        </p>
        {summary.topProducts.length === 0 ? (
          <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.muted, textAlign: "center", padding: "20px 0" }}>
            No sales in this period.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {summary.topProducts.map(([name, qty]) => {
              const maxQty = summary.topProducts[0][1];
              const pct = maxQty > 0 ? (qty / maxQty) * 100 : 0;
              return (
                <div key={name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.text }}>{name}</span>
                    <span style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.muted }}>{qty} sold</span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "9999px", background: colors.surfaceAlt, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: colors.red }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bill history */}
      <div style={cardStyle}>
        <p style={{ fontFamily: fonts.body, fontSize: "14px", fontWeight: 600, color: colors.text, margin: "0 0 14px" }}>
          Bill History
        </p>
        {filteredBills.length === 0 ? (
          <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.muted, textAlign: "center", padding: "20px 0" }}>
            No bills in this period.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {filteredBills.map((bill) => {
              const isExpanded = expandedId === bill.id;
              const isEditing = editingBillId === bill.id;

              return (
                <div key={bill.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <div
                    style={{
                      padding: "12px 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : bill.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        textAlign: "left",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.text, fontWeight: 600 }}>
                        {bill.bill_number} · {bill.customer}
                      </span>
                      <span style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.muted }}>
                        {new Date(bill.created_at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
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
                      <span style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.text, fontWeight: 700, minWidth: "70px", textAlign: "right" }}>
                        ₹{bill.amount.toLocaleString("en-IN")}
                      </span>
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(bill)}
                          title="Edit bill"
                          style={{ background: "none", border: "none", cursor: "pointer", color: colors.muted, display: "flex" }}
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {!isEditing && (
                        <button
                          onClick={() => handleDelete(bill)}
                          disabled={deletingId === bill.id}
                          title="Delete bill"
                          style={{ background: "none", border: "none", cursor: deletingId === bill.id ? "default" : "pointer", color: colors.red, display: "flex", opacity: deletingId === bill.id ? 0.5 : 1 }}
                        >
                          {deletingId === bill.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : bill.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: colors.muted, display: "flex" }}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && !isEditing && (
                    <div style={{ padding: "0 0 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {(bill.items || []).map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", background: colors.surfaceAlt, borderRadius: "6px" }}>
                          <span style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.text }}>
                            {item.name} × {item.qty}
                          </span>
                          <span style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.muted }}>
                            ₹{(item.qty * item.price).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isEditing && (
                    <div style={{ padding: "0 0 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <label style={{ fontFamily: fonts.body, fontSize: "11px", color: colors.muted, display: "block", marginBottom: "4px" }}>
                          Customer
                        </label>
                        <input
                          style={inputStyle}
                          value={editCustomer}
                          onChange={(e) => setEditCustomer(e.target.value)}
                          placeholder="Walk-in"
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {editItems.map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "8px 10px", background: colors.surfaceAlt, borderRadius: "8px" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.text, margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {item.name}
                              </p>
                              <p style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.muted, margin: 0 }}>
                                ₹{item.price} × {item.qty}
                              </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <button
                                onClick={() => changeEditQty(i, -1)}
                                style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "6px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: colors.text }}
                              >
                                <Minus size={12} />
                              </button>
                              <span style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.text, minWidth: "18px", textAlign: "center" }}>
                                {item.qty}
                              </span>
                              <button
                                onClick={() => changeEditQty(i, 1)}
                                style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "6px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: colors.text }}
                              >
                                <Plus size={12} />
                              </button>
                              <button
                                onClick={() => removeEditItem(i)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: colors.red, display: "flex", marginLeft: "4px" }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add product */}
                      <div style={{ position: "relative" }}>
                        <div style={{ position: "relative" }}>
                          <Search size={14} color={colors.muted} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                          <input
                            style={{ ...inputStyle, paddingLeft: "32px" }}
                            value={addProductSearch}
                            onChange={(e) => setAddProductSearch(e.target.value)}
                            placeholder="Add a product…"
                          />
                        </div>
                        {availableProductsForAdd.length > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: "calc(100% + 4px)",
                              left: 0,
                              right: 0,
                              background: colors.surface,
                              border: `1px solid ${colors.border}`,
                              borderRadius: "8px",
                              zIndex: 5,
                              overflow: "hidden",
                            }}
                          >
                            {availableProductsForAdd.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  addProductToEdit(p);
                                  setAddProductSearch("");
                                }}
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "8px 10px",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: colors.text,
                                  fontFamily: fonts.body,
                                  fontSize: "12px",
                                  borderBottom: `1px solid ${colors.border}`,
                                }}
                              >
                                <span>{p.name}</span>
                                <span style={{ color: colors.muted }}>₹{p.price}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: `1px solid ${colors.border}` }}>
                        <span style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.muted }}>New Total</span>
                        <span style={{ fontFamily: fonts.display, fontSize: "18px", fontWeight: 700, color: colors.text }}>
                          ₹{editTotal.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {editError && (
                        <p style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.red, margin: 0 }}>
                          {editError}
                        </p>
                      )}

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => saveEdit(bill.id)}
                          disabled={savingEdit}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: colors.red,
                            color: colors.cream,
                            border: "none",
                            borderRadius: "8px",
                            padding: "9px 16px",
                            fontFamily: fonts.body,
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: savingEdit ? "default" : "pointer",
                            opacity: savingEdit ? 0.7 : 1,
                          }}
                        >
                          {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Save Changes
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "transparent",
                            color: colors.muted,
                            border: `1px solid ${colors.border}`,
                            borderRadius: "8px",
                            padding: "9px 16px",
                            fontFamily: fonts.body,
                            fontSize: "13px",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
