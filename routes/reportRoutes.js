const express = require("express");
const {
  getTodayTasks,
  getLastWeekTasks,
  getTasksByDateRange,
} = require("../controllers/reportController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/today", authMiddleware, getTodayTasks);
router.get("/weekly", authMiddleware, getLastWeekTasks);
router.get("/tasks", authMiddleware, getTasksByDateRange);

module.exports = router;
