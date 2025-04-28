const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      jiraUserId,
      timeDoctorUserId,
      role,
      managers,
      fcmToken,
      JobTitle,
      department,
      location,
      phone,
      dateOfJoining,
      dateOfBirth,
      address,
      emergencyContact,
      emergencyContactNumber,
      salary,
      image,
      leaveBalance,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const checkIfManager = await User.findOne({ _id: managers });
    if (checkIfManager && checkIfManager.role !== "manager") {
      return res.status(400).json({ message: "Manager not found" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      jiraUserId,
      timeDoctorUserId,
      role: role || "user",
      managers,
      fcmToken,
      JobTitle,
      department,
      location,
      phone,
      dateOfJoining,
      dateOfBirth,
      address,
      emergencyContact,
      emergencyContactNumber,
      salary,
      image,
      leaveBalance,
    });

    res.status(201).json({
      message: "User created successfully",
      userId: newUser._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");
    if (!users) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const {
      name,
      password,
      location,
      phone,
      dateOfBirth,
      address,
      emergencyContact,
      emergencyContactNumber,
      image,
    } = req.body;

    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.passwordHash = hashedPassword;
    }
    if (location) user.location = location;
    if (phone) user.phone = phone;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (address) user.address = address;
    if (emergencyContact) user.emergencyContact = emergencyContact;
    if (emergencyContactNumber)
      user.emergencyContactNumber = emergencyContactNumber;

    if (image) user.image = image;

    await user.save();
    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        location: user.location,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        emergencyContact: user.emergencyContact,
        emergencyContactNumber: user.emergencyContactNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.adminUpdateUser = async (req, res) => {
  try {
    const {
      email,
      jiraUserId,
      timeDoctorUserId,
      role,
      managers,
      JobTitle,
      department,
      dateOfJoining,
      salary,
      leaveBalance,
    } = req.body;

    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email) user.email = email;
    if (jiraUserId) user.jiraUserId = jiraUserId;
    if (timeDoctorUserId) user.timeDoctorUserId = timeDoctorUserId;
    if (role) user.role = role;
    if (managers) user.managers = managers;
    if (JobTitle) user.JobTitle = JobTitle;
    if (department) user.department = department;
    if (dateOfJoining) user.dateOfJoining = dateOfJoining;
    if (salary) user.salary = salary;
    if (leaveBalance) user.leaveBalance = leaveBalance;

    await user.save();

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
