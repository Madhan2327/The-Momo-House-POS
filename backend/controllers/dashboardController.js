const pool = require("../db/db");

async function summary(req, res) {
  try {
    const today = await pool.query(`
      SELECT
        COALESCE(SUM(amount),0) AS sales,
        COALESCE(SUM(profit),0) AS profit,
        COUNT(*) AS orders
      FROM bills
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    const totalProducts = await pool.query(
      "SELECT COUNT(*)::int AS count FROM products"
    );

    const lowStock = await pool.query(
      "SELECT COUNT(*)::int AS count FROM products WHERE stock <= low_stock_threshold"
    );

    res.json({
      todaysSales: Number(today.rows[0].sales),
      todaysOrders: Number(today.rows[0].orders),
      todaysProfit: Number(today.rows[0].profit),
      totalProducts: totalProducts.rows[0].count,
      lowStockItems: lowStock.rows[0].count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard summary" });
  }
}

async function chart(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        DATE(created_at) AS day,
        SUM(amount) AS total
      FROM bills
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY day
      ORDER BY day
    `);

    const byDay = {};

    result.rows.forEach((r) => {
      const key = new Date(r.day).toISOString().slice(0, 10);
      byDay[key] = Number(r.total);
    });

    const days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const key = d.toISOString().slice(0, 10);

      days.push({
        label: d.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        total: byDay[key] || 0,
      });
    }

    const max = Math.max(...days.map((d) => d.total), 1);

    res.json(
      days.map((d) => ({
        ...d,
        pct: Math.round((d.total / max) * 100),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load chart" });
  }
}

async function recentBills(req, res) {
  try {
    const bills = await pool.query(`
      SELECT
        id,
        bill_number,
        customer,
        amount,
        status,
        created_at
      FROM bills
      ORDER BY created_at DESC
      LIMIT 6
    `);

    const data = [];

    for (const bill of bills.rows) {
      const itemCount = await pool.query(
        "SELECT COALESCE(SUM(qty),0)::int AS count FROM bill_items WHERE bill_id=$1",
        [bill.id]
      );

      data.push({
        id: bill.bill_number,
        customer: bill.customer,
        amount: Number(bill.amount),
        status: bill.status,
        time: new Date(bill.created_at).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        items: itemCount.rows[0].count,
      });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load recent bills" });
  }
}

async function bestSellers(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        name,
        SUM(qty)::int AS sold
      FROM bill_items
      GROUP BY name
      ORDER BY sold DESC
      LIMIT 5
    `);

    const rows = result.rows;

    const max = rows.length ? rows[0].sold : 1;

    res.json(
      rows.map((r) => ({
        name: r.name,
        sold: r.sold,
        pct: Math.round((r.sold / max) * 100),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load best sellers" });
  }
}

module.exports = {
  summary,
  chart,
  recentBills,
  bestSellers,
};