const express = require("express");
const {
  loginUser,
  createUser,
  getUser,
  updateUser,
  adminUpdateUser,
} = require("../controllers/authController");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginUser);
router.post("/create", authMiddleware, isAdmin, createUser);
router.post("/allusers", authMiddleware, getUser);
router.post("/update-user", authMiddleware, updateUser);
router.post("/admin-update-user", authMiddleware, isAdmin, adminUpdateUser);

module.exports = router;
