const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  applyLeave,
  getMyLeaves,
  approveLeave,
  getTeamLeaves,
} = require("../controllers/leaveController");

const router = express.Router();

router.post("/apply", authMiddleware, applyLeave);
router.get("/myleaves", authMiddleware, getMyLeaves);
router.post("/approve", authMiddleware, approveLeave);
router.post("/teamleaves", authMiddleware, getTeamLeaves);

module.exports = router;
