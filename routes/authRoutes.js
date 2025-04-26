const express = require("express");
const { loginUser, createUser } = require("../controllers/authController");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginUser);
router.post("/create", createUser);

module.exports = router;
