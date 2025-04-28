const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  console.log("Token:", token);

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

exports.isAdmin = async (req, res, next) => {
  // console.log("User role:", req.user);
  const getUser = await User.findById(req.user);
  if (!getUser) {
    return res.status(404).json({ message: "User not found" });
  }
  // console.log("User role:", getUser.role);

  if (getUser.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

exports.isManager = (req, res, next) => {
  const getUser = User.findById(req.user);
  if (!getUser) {
    return res.status(404).json({ message: "User not found" });
  }
  if (getUser.role !== "manager") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

exports.isHR = (req, res, next) => {
  const getUser = User.findById(req.user);
  if (!getUser) {
    return res.status(404).json({ message: "User not found" });
  }
  if (getUser.role !== "hr") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

exports.isCEO = (req, res, next) => {
  const getUser = User.findById(req.user);
  if (!getUser) {
    return res.status(404).json({ message: "User not found" });
  }
  if (getUser.role !== "ceo") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};
