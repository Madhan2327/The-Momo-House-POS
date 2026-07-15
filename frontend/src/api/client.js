// Central API client — every backend call goes through here so the
// base URL and auth header only need to be set in one place.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("momo_token");
}

async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

export const api = {
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  changePassword: (currentPassword, newPassword) =>
    request("/auth/change-password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) }),

  getProducts: () => request("/products"),
  createProduct: (product) => request("/products", { method: "POST", body: JSON.stringify(product) }),
  updateProduct: (id, product) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(product) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  getBills: () => request("/bills"),
  createBill: (bill) => request("/bills", { method: "POST", body: JSON.stringify(bill) }),
  updateBill: (id, bill) => request(`/bills/${id}`, { method: "PUT", body: JSON.stringify(bill) }),
  deleteBill: (id) => request(`/bills/${id}`, { method: "DELETE" }),

  getDashboardSummary: () => request("/dashboard/summary"),
  getDashboardChart: () => request("/dashboard/chart"),
  getRecentBills: () => request("/dashboard/recent-bills"),
  getBestSellers: () => request("/dashboard/best-sellers"),

  getSettings: () => request("/settings"),
  updateSettings: (settings) => request("/settings", { method: "PUT", body: JSON.stringify(settings) }),
};
