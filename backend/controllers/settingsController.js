const pool = require("../db/db");

async function getSettings(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM settings WHERE id = 1"
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load settings" });
  }
}

async function updateSettings(req, res) {
  try {
    const current = await pool.query(
      "SELECT * FROM settings WHERE id = 1"
    );

    const existing = current.rows[0];

    const {
      shop_name,
      address,
      phone,
      gst_number,
    } = req.body;

    await pool.query(
      `UPDATE settings
       SET
         shop_name = $1,
         address = $2,
         phone = $3,
         gst_number = $4,
         updated_at = NOW()
       WHERE id = 1`,
      [
        shop_name ?? existing.shop_name,
        address ?? existing.address,
        phone ?? existing.phone,
        gst_number ?? existing.gst_number,
      ]
    );

    const updated = await pool.query(
      "SELECT * FROM settings WHERE id = 1"
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
}

module.exports = {
  getSettings,
  updateSettings,
};