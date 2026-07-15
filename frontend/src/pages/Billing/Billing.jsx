import { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Search,
} from "lucide-react";
import { colors, fonts } from "../../styles/theme";
import { api } from "../../api/client";

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState([]); // [{product_id, name, price, cost, qty, stock}]
  const [customer, setCustomer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [lastBill, setLastBill] = useState(null);

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

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product_id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev; // don't exceed stock
        return prev.map((c) =>
          c.product_id === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      if (product.stock <= 0) return prev;
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          cost: product.cost,
          qty: 1,
          stock: product.stock,
        },
      ];
    });
  }

  function changeQty(productId, delta) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product_id !== productId) return c;
          const nextQty = c.qty + delta;
          if (nextQty <= 0) return null;
          if (nextQty > c.stock) return c;
          return { ...c, qty: nextQty };
        })
        .filter(Boolean)
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((c) => c.product_id !== productId));
  }

  const total = cart.reduce((sum, c) => sum + c.qty * c.price, 0);
  const itemCount = cart.reduce((sum, c) => sum + c.qty, 0);

  async function handleCheckout() {
    if (cart.length === 0) return;
    setSaving(true);
    setSaveError("");
    setLastBill(null);

    try {
      const bill = await api.createBill({
        customer: customer.trim() || "Walk-in",
        status: "Paid",
        items: cart.map((c) => ({
          product_id: c.product_id,
          name: c.name,
          qty: c.qty,
          price: c.price,
          cost: c.cost,
        })),
      });
      setLastBill(bill);
      setCart([]);
      setCustomer("");
      await loadProducts(); // refresh stock numbers
    } catch (err) {
      setSaveError(err.message || "Failed to save bill");
    } finally {
      setSaving(false);
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
        <span style={{ fontFamily: fonts.body, fontSize: "14px" }}>Loading products…</span>
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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr",
        gap: "20px",
        alignItems: "start",
      }}
    >
      {/* Left: product picker */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ position: "relative" }}>
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

        {products.length === 0 ? (
          <div style={cardStyle}>
            <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.muted, textAlign: "center", padding: "20px 0", margin: 0 }}>
              No products yet — add some from the Products page first.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
              gap: "12px",
            }}
          >
            {filteredProducts.map((p) => {
              const outOfStock = p.stock <= 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={outOfStock}
                  style={{
                    ...cardStyle,
                    textAlign: "left",
                    cursor: outOfStock ? "not-allowed" : "pointer",
                    opacity: outOfStock ? 0.5 : 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <p style={{ fontFamily: fonts.body, fontSize: "13px", fontWeight: 600, color: colors.text, margin: 0 }}>
                    {p.name}
                  </p>
                  <p style={{ fontFamily: fonts.body, fontSize: "11px", color: colors.muted, margin: 0 }}>
                    {p.category}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                    <span style={{ fontFamily: fonts.body, fontSize: "14px", fontWeight: 700, color: colors.red }}>
                      ₹{Number(p.price).toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontFamily: fonts.body, fontSize: "11px", color: outOfStock ? colors.red : colors.muted }}>
                      {outOfStock ? "Out of stock" : `${p.stock} left`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: cart + checkout */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", position: isMobile ? "static" : "sticky", top: "0" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <ShoppingCart size={18} color={colors.red} />
            <p style={{ fontFamily: fonts.body, fontSize: "14px", fontWeight: 600, color: colors.text, margin: 0 }}>
              Current Bill {itemCount > 0 && `(${itemCount} items)`}
            </p>
          </div>

          {cart.length === 0 ? (
            <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.muted, textAlign: "center", padding: "24px 0" }}>
              Tap a product to add it to the bill.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              {cart.map((c) => (
                <div key={c.product_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.text, margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.name}
                    </p>
                    <p style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.muted, margin: 0 }}>
                      ₹{c.price} × {c.qty}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      onClick={() => changeQty(c.product_id, -1)}
                      style={{ background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "6px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: colors.text }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.text, minWidth: "18px", textAlign: "center" }}>
                      {c.qty}
                    </span>
                    <button
                      onClick={() => changeQty(c.product_id, 1)}
                      disabled={c.qty >= c.stock}
                      style={{ background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "6px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: c.qty >= c.stock ? "not-allowed" : "pointer", opacity: c.qty >= c.stock ? 0.4 : 1, color: colors.text }}
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => removeFromCart(c.product_id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: colors.red, display: "flex", marginLeft: "4px" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.muted, marginBottom: "6px", display: "block" }}>
              Customer name (optional)
            </label>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Walk-in"
              style={{
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
              }}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.muted, marginBottom: "6px", display: "block" }}>
              Payment method
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {["Cash", "UPI", "Card"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "8px",
                    border: `1px solid ${paymentMethod === m ? colors.red : colors.border}`,
                    background: paymentMethod === m ? colors.redSoft : "transparent",
                    color: paymentMethod === m ? colors.red : colors.muted,
                    fontFamily: fonts.body,
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 0",
              borderTop: `1px solid ${colors.border}`,
              marginBottom: "14px",
            }}
          >
            <span style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.muted }}>Total</span>
            <span style={{ fontFamily: fonts.display, fontSize: "24px", fontWeight: 700, color: colors.text }}>
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>

          {saveError && (
            <p style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.red, margin: "0 0 12px" }}>
              {saveError}
            </p>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || saving}
            style={{
              width: "100%",
              background: cart.length === 0 ? colors.mutedDim : colors.red,
              color: colors.cream,
              border: "none",
              borderRadius: "8px",
              padding: "12px",
              fontFamily: fonts.body,
              fontSize: "14px",
              fontWeight: 700,
              cursor: cart.length === 0 || saving ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving…" : "Save Bill"}
          </button>
        </div>

        {lastBill && (
          <div style={{ ...cardStyle, borderColor: colors.success }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <CheckCircle2 size={16} color={colors.success} />
              <p style={{ fontFamily: fonts.body, fontSize: "13px", fontWeight: 600, color: colors.text, margin: 0 }}>
                Bill {lastBill.bill_number} saved
              </p>
            </div>
            <p style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.muted, margin: 0 }}>
              ₹{Number(lastBill.amount).toLocaleString("en-IN")} · {lastBill.customer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
