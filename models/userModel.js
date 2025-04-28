const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    jiraUserId: { type: String }, // optional for now
    timeDoctorUserId: { type: String }, // optional for now
    role: {
      type: String,
      enum: ["admin", "hr", "hrManager", "manager", "ceo", "user"],
      default: "user",
    },
    managers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    fcmToken: { type: String },
    JobTitle: { type: String },
    department: { type: String },
    location: { type: String },
    phone: { type: String },
    dateOfJoining: { type: Date },
    dateOfBirth: { type: Date },
    address: { type: String },
    emergencyContact: { type: String },
    emergencyContactNumber: { type: String },
    salary: { type: Number },
    image: { type: String },
    leaveBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);