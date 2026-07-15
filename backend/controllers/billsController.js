const { db } = require("../db/init");

function generateBillNumber() {
  const row = db.prepare("SELECT COUNT(*) AS count FROM bills").get();
  return `#${1000 + row.count + 1}`;
}

function getAll(req, res) {
  const bills = db.prepare("SELECT * FROM bills ORDER BY created_at DESC").all();
  const items = db.prepare("SELECT * FROM bill_items WHERE bill_id = ?");

  const withItems = bills.map((bill) => ({
    ...bill,
    items: items.all(bill.id),
  }));

  res.json(withItems);
}

function getOne(req, res) {
  const bill = db.prepare("SELECT * FROM bills WHERE id = ?").get(req.params.id);
  if (!bill) return res.status(404).json({ error: "Bill not found" });
  const items = db.prepare("SELECT * FROM bill_items WHERE bill_id = ?").all(bill.id);
  res.json({ ...bill, items });
}

// Creates a bill + its line items, and decrements product stock — all atomically.
const create = db.transaction((body) => {
  const { customer, items, status } = body;

  if (!Array.isArray(items) || items.length === 0) {
    throw { status: 400, message: "items array is required and cannot be empty" };
  }

  let amount = 0;
  let profit = 0;

  for (const item of items) {
    if (!item.name || !item.qty || item.price == null) {
      throw { status: 400, message: "each item needs name, qty, and price" };
    }
    amount += item.qty * item.price;
    profit += item.qty * (item.price - (item.cost || 0));
  }

  const billNumber = generateBillNumber();

  const billResult = db
    .prepare(
      `INSERT INTO bills (bill_number, customer, amount, profit, status)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(billNumber, customer || "Walk-in", amount, profit, status || "Paid");

  const billId = billResult.lastInsertRowid;

  const insertItem = db.prepare(
    `INSERT INTO bill_items (bill_id, product_id, name, qty, price, cost)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const decrementStock = db.prepare(
    `UPDATE products SET stock = MAX(stock - ?, 0), updated_at = datetime('now') WHERE id = ?`
  );

  for (const item of items) {
    insertItem.run(billId, item.product_id || null, item.name, item.qty, item.price, item.cost || 0);
    if (item.product_id) {
      decrementStock.run(item.qty, item.product_id);
    }
  }

  return db.prepare("SELECT * FROM bills WHERE id = ?").get(billId);
});

// Replaces a bill's items: restores stock from the old items, deletes them,
// inserts the new items, deducts stock for those, and recalculates totals.
const update = db.transaction((billId, body) => {
  const existingBill = db.prepare("SELECT * FROM bills WHERE id = ?").get(billId);
  if (!existingBill) {
    throw { status: 404, message: "Bill not found" };
  }

  const { customer, items, status } = body;

  if (!Array.isArray(items) || items.length === 0) {
    throw { status: 400, message: "items array is required and cannot be empty" };
  }

  for (const item of items) {
    if (!item.name || !item.qty || item.price == null) {
      throw { status: 400, message: "each item needs name, qty, and price" };
    }
  }

  const restoreStock = db.prepare(
    `UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?`
  );
  const decrementStock = db.prepare(
    `UPDATE products SET stock = MAX(stock - ?, 0), updated_at = datetime('now') WHERE id = ?`
  );

  const oldItems = db.prepare("SELECT * FROM bill_items WHERE bill_id = ?").all(billId);
  for (const oldItem of oldItems) {
    if (oldItem.product_id) {
      restoreStock.run(oldItem.qty, oldItem.product_id);
    }
  }

  db.prepare("DELETE FROM bill_items WHERE bill_id = ?").run(billId);

  let amount = 0;
  let profit = 0;
  const insertItem = db.prepare(
    `INSERT INTO bill_items (bill_id, product_id, name, qty, price, cost)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  for (const item of items) {
    amount += item.qty * item.price;
    profit += item.qty * (item.price - (item.cost || 0));
    insertItem.run(billId, item.product_id || null, item.name, item.qty, item.price, item.cost || 0);
    if (item.product_id) {
      decrementStock.run(item.qty, item.product_id);
    }
  }

  db.prepare(
    `UPDATE bills SET customer = ?, amount = ?, profit = ?, status = ? WHERE id = ?`
  ).run(
    customer ?? existingBill.customer,
    amount,
    profit,
    status ?? existingBill.status,
    billId
  );

  return db.prepare("SELECT * FROM bills WHERE id = ?").get(billId);
});

// Deletes a bill entirely and restores the stock it had deducted — atomically.
const remove = db.transaction((billId) => {
  const existingBill = db.prepare("SELECT * FROM bills WHERE id = ?").get(billId);
  if (!existingBill) {
    throw { status: 404, message: "Bill not found" };
  }

  const restoreStock = db.prepare(
    `UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?`
  );

  const items = db.prepare("SELECT * FROM bill_items WHERE bill_id = ?").all(billId);
  for (const item of items) {
    if (item.product_id) {
      restoreStock.run(item.qty, item.product_id);
    }
  }

  // bill_items has ON DELETE CASCADE, so deleting the bill removes its items too
  db.prepare("DELETE FROM bills WHERE id = ?").run(billId);
});

function createHandler(req, res) {
  try {
    const bill = create(req.body);
    const items = db.prepare("SELECT * FROM bill_items WHERE bill_id = ?").all(bill.id);
    res.status(201).json({ ...bill, items });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Failed to create bill" });
  }
}

function updateHandler(req, res) {
  try {
    const bill = update(Number(req.params.id), req.body);
    const items = db.prepare("SELECT * FROM bill_items WHERE bill_id = ?").all(bill.id);
    res.json({ ...bill, items });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Failed to update bill" });
  }
}

function removeHandler(req, res) {
  try {
    remove(Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Failed to delete bill" });
  }
}

module.exports = { getAll, getOne, create: createHandler, update: updateHandler, remove: removeHandler };
