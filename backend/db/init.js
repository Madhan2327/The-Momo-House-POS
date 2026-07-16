const pool = require("./db");
const bcrypt = require("bcryptjs");

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      price NUMERIC DEFAULT 0,
      cost NUMERIC DEFAULT 0,
      stock INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 10,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bills (
      id SERIAL PRIMARY KEY,
      bill_number TEXT UNIQUE NOT NULL,
      customer TEXT DEFAULT 'Walk-in',
      amount NUMERIC DEFAULT 0,
      profit NUMERIC DEFAULT 0,
      status TEXT DEFAULT 'Paid',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id SERIAL PRIMARY KEY,
      bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      qty INTEGER NOT NULL,
      price NUMERIC NOT NULL,
      cost NUMERIC DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      shop_name TEXT DEFAULT 'The Momo House',
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      gst_number TEXT DEFAULT '',
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const user = await pool.query(
    "SELECT id FROM users WHERE username=$1",
    [adminUsername]
  );

  if (user.rows.length === 0) {
    const hash = await bcrypt.hash(adminPassword, 10);

    await pool.query(
      "INSERT INTO users(username,password_hash) VALUES($1,$2)",
      [adminUsername, hash]
    );

    console.log("✅ Admin user created");
  }

  const settings = await pool.query(
    "SELECT id FROM settings WHERE id=1"
  );

  if (settings.rows.length === 0) {
    await pool.query(
      `INSERT INTO settings(id,shop_name,address,phone,gst_number)
       VALUES(1,'The Momo House','','','')`
    );
  }
}

module.exports = { init };