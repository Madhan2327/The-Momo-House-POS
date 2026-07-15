const { db } = require("../db/init");

function getAll(req, res) {
  const products = db.prepare("SELECT * FROM products ORDER BY name ASC").all();
  res.json(products);
}

function getOne(req, res) {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
}

function create(req, res) {
  const { name, category, price, cost, stock, low_stock_threshold } = req.body;

  if (!name || price == null) {
    return res.status(400).json({ error: "name and price are required" });
  }

  const result = db
    .prepare(
      `INSERT INTO products (name, category, price, cost, stock, low_stock_threshold)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(name, category || "General", price, cost || 0, stock || 0, low_stock_threshold || 10);

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(product);
}

function update(req, res) {
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });

  const { name, category, price, cost, stock, low_stock_threshold } = req.body;

  db.prepare(
    `UPDATE products SET
      name = ?, category = ?, price = ?, cost = ?, stock = ?, low_stock_threshold = ?,
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    name ?? existing.name,
    category ?? existing.category,
    price ?? existing.price,
    cost ?? existing.cost,
    stock ?? existing.stock,
    low_stock_threshold ?? existing.low_stock_threshold,
    req.params.id
  );

  const updated = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  res.json(updated);
}

function remove(req, res) {
  const result = db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Product not found" });
  res.json({ success: true });
}

module.exports = { getAll, getOne, create, update, remove };
