const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { summary, chart, recentBills, bestSellers } = require("../controllers/dashboardController");

const router = express.Router();

router.use(requireAuth);

router.get("/summary", summary);
router.get("/chart", chart);
router.get("/recent-bills", recentBills);
router.get("/best-sellers", bestSellers);

module.exports = router;
