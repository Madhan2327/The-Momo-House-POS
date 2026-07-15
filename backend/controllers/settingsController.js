const { db } = require("../db/init");

function getSettings(req, res) {
  const settings = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  res.json(settings);
}

function updateSettings(req, res) {
  const existing = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  const { shop_name, address, phone, gst_number } = req.body;

  db.prepare(
    `UPDATE settings SET
      shop_name = ?, address = ?, phone = ?, gst_number = ?,
      updated_at = datetime('now')
     WHERE id = 1`
  ).run(
    shop_name ?? existing.shop_name,
    address ?? existing.address,
    phone ?? existing.phone,
    gst_number ?? existing.gst_number
  );

  const updated = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  res.json(updated);
}

module.exports = { getSettings, updateSettings };
