import { Routes, Route } from "react-router-dom";
import Login from "../pages/login/Login";
import Layout from "../components/layout/Layout";
import Dashboard from "../pages/dashboard/Dashboard";
import Billing from "../pages/billing/Billing";
import Products from "../pages/products/Products";
import Stock from "../pages/stock/Stock";
import Reports from "../pages/reports/Reports";
import Settings from "../pages/settings/Settings";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/products" element={<Products />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}