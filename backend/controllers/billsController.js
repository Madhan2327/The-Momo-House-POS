const pool = require("../db/db");

async function generateBillNumber(client) {
  const { rows } = await client.query("SELECT COUNT(*) AS count FROM bills");
  const count = parseInt(rows[0].count, 10);
  return `#${1000 + count + 1}`;
}

async function getAll(req, res) {
  try {
    const { rows: bills } = await pool.query(
      "SELECT * FROM bills ORDER BY created_at DESC"
    );

    if (bills.length === 0) {
      return res.json([]);
    }

    const { rows: allItems } = await pool.query(
      "SELECT * FROM bill_items WHERE bill_id = ANY($1::int[])",
      [bills.map((b) => b.id)]
    );

    const itemsByBill = {};

    allItems.forEach((item) => {
      if (!itemsByBill[item.bill_id]) {
        itemsByBill[item.bill_id] = [];
      }
      itemsByBill[item.bill_id].push(item);
    });

    res.json(
      bills.map((bill) => ({
        ...bill,
        items: itemsByBill[bill.id] || [],
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bills" });
  }
}

async function getOne(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM bills WHERE id = $1",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Bill not found" });
    }

    const bill = rows[0];

    const { rows: items } = await pool.query(
      "SELECT * FROM bill_items WHERE bill_id = $1",
      [bill.id]
    );

    res.json({
      ...bill,
      items,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bill" });
  }
}

async function create(body) {
  const { customer, items, status } = body;

  if (!Array.isArray(items) || items.length === 0) {
    throw {
      status: 400,
      message: "Items are required",
    };
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let amount = 0;
    let profit = 0;

    for (const item of items) {
      amount += item.qty * item.price;
      profit += item.qty * (item.price - (item.cost || 0));
    }

    const billNumber = await generateBillNumber(client);

    const { rows } = await client.query(
      `INSERT INTO bills
      (bill_number, customer, amount, profit, status)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [
        billNumber,
        customer || "Walk-in",
        amount,
        profit,
        status || "Paid",
      ]
    );

    const bill = rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO bill_items
        (bill_id, product_id, name, qty, price, cost)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          bill.id,
          item.product_id || null,
          item.name,
          item.qty,
          item.price,
          item.cost || 0,
        ]
      );

      if (item.product_id) {
        await client.query(
          `UPDATE products
           SET stock = GREATEST(stock - $1,0),
               updated_at = NOW()
           WHERE id = $2`,
          [item.qty, item.product_id]
        );
      }
    }

    await client.query("COMMIT");

    return bill;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function update(id, body) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "SELECT * FROM bills WHERE id=$1 FOR UPDATE",
      [id]
    );

    if (rows.length === 0) {
      throw {
        status: 404,
        message: "Bill not found",
      };
    }

    const bill = rows[0];

    const oldItems = await client.query(
      "SELECT * FROM bill_items WHERE bill_id=$1",
      [id]
    );

    for (const item of oldItems.rows) {
      if (item.product_id) {
        await client.query(
          `UPDATE products
           SET stock = stock + $1,
               updated_at = NOW()
           WHERE id=$2`,
          [item.qty, item.product_id]
        );
      }
    }

    await client.query(
      "DELETE FROM bill_items WHERE bill_id=$1",
      [id]
    );

    let amount = 0;
    let profit = 0;

    for (const item of body.items) {
      amount += item.qty * item.price;
      profit += item.qty * (item.price - (item.cost || 0));

      await client.query(
        `INSERT INTO bill_items
        (bill_id,product_id,name,qty,price,cost)
        VALUES($1,$2,$3,$4,$5,$6)`,
        [
          id,
          item.product_id || null,
          item.name,
          item.qty,
          item.price,
          item.cost || 0,
        ]
      );

      if (item.product_id) {
        await client.query(
          `UPDATE products
           SET stock = GREATEST(stock-$1,0),
               updated_at = NOW()
           WHERE id=$2`,
          [item.qty, item.product_id]
        );
      }
    }

    const updated = await client.query(
      `UPDATE bills
       SET customer=$1,
           amount=$2,
           profit=$3,
           status=$4
       WHERE id=$5
       RETURNING *`,
      [
        body.customer || bill.customer,
        amount,
        profit,
        body.status || bill.status,
        id,
      ]
    );

    await client.query("COMMIT");

    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function remove(id) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const items = await client.query(
      "SELECT * FROM bill_items WHERE bill_id=$1",
      [id]
    );

    for (const item of items.rows) {
      if (item.product_id) {
        await client.query(
          `UPDATE products
           SET stock = stock + $1,
               updated_at = NOW()
           WHERE id=$2`,
          [item.qty, item.product_id]
        );
      }
    }

    await client.query(
      "DELETE FROM bills WHERE id=$1",
      [id]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function createHandler(req, res) {
  try {
    const bill = await create(req.body);

    const { rows: items } = await pool.query(
      "SELECT * FROM bill_items WHERE bill_id=$1",
      [bill.id]
    );

    res.status(201).json({
      ...bill,
      items,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Failed to create bill",
    });
  }
}

async function updateHandler(req, res) {
  try {
    const bill = await update(Number(req.params.id), req.body);

    const { rows: items } = await pool.query(
      "SELECT * FROM bill_items WHERE bill_id=$1",
      [bill.id]
    );

    res.json({
      ...bill,
      items,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Failed to update bill",
    });
  }
}

async function removeHandler(req, res) {
  try {
    await remove(Number(req.params.id));
    res.json({
      success: true,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Failed to delete bill",
    });
  }
}

module.exports = {
  getAll,
  getOne,
  create: createHandler,
  update: updateHandler,
  remove: removeHandler,
};