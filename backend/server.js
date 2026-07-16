require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Connect to PostgreSQL
const pool = require("./db/db");

const authRoutes = require("./routes/auth.routes");
const productsRoutes = require("./routes/products.routes");
const billsRoutes = require("./routes/bills.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const settingsRoutes = require("./routes/settings.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Test PostgreSQL connection
pool.query("SELECT NOW()")
  .then(() => {
    console.log("✅ Connected to PostgreSQL");
  })
  .catch((err) => {
    console.error("❌ PostgreSQL connection failed:", err.message);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/bills", billsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: "PostgreSQL",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Momo House backend running on port ${PORT}`);
});