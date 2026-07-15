import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { colors, fonts } from "../../styles/theme";
import { api } from "../../api/client";

const EMPTY_FORM = {
  name: "",
  category: "General",
  price: "",
  cost: "",
  stock: "",
  low_stock_threshold: "10",
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category || "General",
      price: String(product.price ?? ""),
      cost: String(product.cost ?? ""),
      stock: String(product.stock ?? ""),
      low_stock_threshold: String(product.low_stock_threshold ?? "10"),
    });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || form.price === "") {
      setFormError("Name and price are required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || "General",
      price: Number(form.price),
      cost: Number(form.cost) || 0,
      stock: Number(form.stock) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 10,
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.updateProduct(editingId, payload);
      } else {
        await api.createProduct(payload);
      }
      await loadProducts();
      closeForm();
    } catch (err) {
      setFormError(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      alert(err.message || "Failed to delete product");
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
    padding: "10px 12px",
    fontFamily: fonts.body,
    fontSize: "13px",
    color: colors.text,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontFamily: fonts.body,
    fontSize: "12px",
    color: colors.muted,
    marginBottom: "6px",
    display: "block",
  };

  if (loading && products.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: colors.muted, gap: "10px" }}>
        <Loader2 size={20} className="animate-spin" />
        <span style={{ fontFamily: fonts.body, fontSize: "14px" }}>Loading products…</span>
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
            <Package size={18} color={colors.muted} />
          </div>
          <p style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 700, color: colors.text, margin: 0 }}>
            Products <span style={{ fontFamily: fonts.body, fontSize: "13px", fontWeight: 400, color: colors.muted }}>({products.length})</span>
          </p>
        </div>

        <button
          onClick={openAddForm}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: colors.red,
            color: colors.cream,
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            fontFamily: fonts.body,
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = colors.redHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = colors.red)}
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {error && (
        <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "10px", color: colors.red }}>
          <AlertTriangle size={18} />
          <span style={{ fontFamily: fonts.body, fontSize: "14px" }}>{error}</span>
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <p style={{ fontFamily: fonts.body, fontSize: "14px", fontWeight: 600, color: colors.text, margin: 0 }}>
              {editingId ? "Edit Product" : "Add New Product"}
            </p>
            <button
              onClick={closeForm}
              style={{ background: "none", border: "none", cursor: "pointer", color: colors.muted, display: "flex" }}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1fr 1fr 1fr",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Chicken Momo (6 pcs)"
                />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <input
                  style={inputStyle}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Veg / Chicken"
                />
              </div>
              <div>
                <label style={labelStyle}>Price (₹) *</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="120"
                />
              </div>
              <div>
                <label style={labelStyle}>Cost (₹)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  placeholder="60"
                />
              </div>
              <div>
                <label style={labelStyle}>Stock</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div>
                <label style={labelStyle}>Low Stock At</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={form.low_stock_threshold}
                  onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>

            {formError && (
              <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.red, margin: "0 0 12px" }}>
                {formError}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: colors.red,
                  color: colors.cream,
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontFamily: fonts.body,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingId ? "Save Changes" : "Add Product"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                style={{
                  background: "transparent",
                  color: colors.muted,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontFamily: fonts.body,
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products table */}
      <div style={cardStyle}>
        {products.length === 0 ? (
          <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.muted, textAlign: "center", padding: "40px 0" }}>
            No products yet — click "Add Product" to create your first menu item.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
              <thead>
                <tr>
                  {["Name", "Category", "Price", "Cost", "Stock", "Status", ""].map((h) => (
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
                {products.map((p) => {
                  const isLow = p.stock <= p.low_stock_threshold;
                  return (
                    <tr key={p.id}>
                      <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "13px", color: colors.text, fontWeight: 500 }}>
                        {p.name}
                      </td>
                      <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "13px", color: colors.muted }}>
                        {p.category}
                      </td>
                      <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "13px", color: colors.text, fontWeight: 600 }}>
                        ₹{Number(p.price).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "13px", color: colors.muted }}>
                        ₹{Number(p.cost).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 12px 12px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: "13px", color: colors.text }}>
                        {p.stock}
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
                      <td style={{ padding: "12px 0", borderBottom: `1px solid ${colors.border}`, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => openEditForm(p)}
                            title="Edit"
                            style={{ background: "none", border: "none", cursor: "pointer", color: colors.muted, display: "flex", padding: "4px" }}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            title="Delete"
                            style={{ background: "none", border: "none", cursor: "pointer", color: colors.red, display: "flex", padding: "4px" }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
