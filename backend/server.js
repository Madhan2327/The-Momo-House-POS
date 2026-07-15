require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { init } = require("./db/init");
const authRoutes = require("./routes/auth.routes");
const productsRoutes = require("./routes/products.routes");
const billsRoutes = require("./routes/bills.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const settingsRoutes = require("./routes/settings.routes");

init();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/bills", billsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Momo House backend running on http://localhost:${PORT}`);
});
