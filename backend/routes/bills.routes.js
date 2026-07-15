const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getAll, getOne, create, update, remove } = require("../controllers/billsController");

const router = express.Router();

router.use(requireAuth);

router.get("/", getAll);
router.get("/:id", getOne);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

module.exports = router;
