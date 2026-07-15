const { db } = require("../db/init");

function summary(req, res) {
  const today = db
    .prepare(
      `SELECT
         COALESCE(SUM(amount), 0) AS sales,
         COALESCE(SUM(profit), 0) AS profit,
         COUNT(*) AS orders
       FROM bills
       WHERE date(created_at) = date('now', 'localtime')`
    )
    .get();

  const totalProducts = db.prepare("SELECT COUNT(*) AS count FROM products").get().count;
  const lowStock = db
    .prepare("SELECT COUNT(*) AS count FROM products WHERE stock <= low_stock_threshold")
    .get().count;

  res.json({
    todaysSales: today.sales,
    todaysOrders: today.orders,
    todaysProfit: today.profit,
    totalProducts,
    lowStockItems: lowStock,
  });
}

function chart(req, res) {
  // Last 7 days, oldest first, using SQLite's local date grouping
  const rows = db
    .prepare(
      `SELECT date(created_at, 'localtime') AS day, SUM(amount) AS total
       FROM bills
       WHERE date(created_at, 'localtime') >= date('now', 'localtime', '-6 days')
       GROUP BY day`
    )
    .all();

  const byDay = Object.fromEntries(rows.map((r) => [r.day, r.total]));

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      total: byDay[key] || 0,
    });
  }

  const max = Math.max(...days.map((d) => d.total), 1);
  res.json(days.map((d) => ({ ...d, pct: Math.round((d.total / max) * 100) })));
}

function recentBills(req, res) {
  const bills = db
    .prepare(
      `SELECT id, bill_number AS id_display, customer, amount, status, created_at
       FROM bills
       ORDER BY created_at DESC
       LIMIT 6`
    )
    .all();

  const itemCount = db.prepare(
    "SELECT COALESCE(SUM(qty), 0) AS count FROM bill_items WHERE bill_id = ?"
  );

  res.json(
    bills.map((b) => {
      // Convert SQLite UTC timestamp to IST
      const date = new Date(b.created_at + "Z");
      date.setMinutes(date.getMinutes() + 330);

      return {
        id: b.id_display,
        customer: b.customer,
        amount: b.amount,
        status: b.status,
        time: date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        items: itemCount.get(b.id).count,
      };
    })
  );
}

function bestSellers(req, res) {
  const rows = db
    .prepare(
      `SELECT name, SUM(qty) AS sold
       FROM bill_items
       GROUP BY name
       ORDER BY sold DESC
       LIMIT 5`
    )
    .all();

  const max = rows[0]?.sold || 1;
  res.json(rows.map((r) => ({ ...r, pct: Math.round((r.sold / max) * 100) })));
}

module.exports = { summary, chart, recentBills, bestSellers };
