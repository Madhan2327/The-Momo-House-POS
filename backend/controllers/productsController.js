const pool = require("../db/db");

async function getAll(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}

async function getOne(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
}

async function create(req, res) {
  try {
    const {
      name,
      category,
      price,
      cost,
      stock,
      low_stock_threshold,
    } = req.body;

    if (!name || price == null) {
      return res.status(400).json({
        error: "name and price are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO products
      (name, category, price, cost, stock, low_stock_threshold)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        name,
        category || "General",
        price,
        cost || 0,
        stock || 0,
        low_stock_threshold || 10,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
}

async function update(req, res) {
  try {
    const existing = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [req.params.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    const product = existing.rows[0];

    const {
      name,
      category,
      price,
      cost,
      stock,
      low_stock_threshold,
    } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET
         name=$1,
         category=$2,
         price=$3,
         cost=$4,
         stock=$5,
         low_stock_threshold=$6,
         updated_at=NOW()
       WHERE id=$7
       RETURNING *`,
      [
        name ?? product.name,
        category ?? product.category,
        price ?? product.price,
        cost ?? product.cost,
        stock ?? product.stock,
        low_stock_threshold ?? product.low_stock_threshold,
        req.params.id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to update product",
    });
  }
}

async function remove(req, res) {
  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to delete product",
    });
  }
}

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove,
};