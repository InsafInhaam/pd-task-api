const Leave = require("../models/leaveModal");
const User = require("../models/userModel");
const { sendNotification } = require("../utils/notification");

exports.applyLeave = async (req, res) => {
  const { startDate, endDate, reason } = req.body;
  const userId = req.user;
  //   console.log("User ID:", userId);

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the leave dates are valid
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Please provide start and end dates" });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res
        .status(400)
        .json({ message: "End date must be after start date" });
    }
    // Check if the reason is provided
    if (!reason) {
      return res
        .status(400)
        .json({ message: "Please provide a reason for leave" });
    }

    // Check if the user has already applied for leave during the same period
    const existingLeave = await Leave.findOne({
      userId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });

    if (existingLeave) {
      return res
        .status(400)
        .json({ message: "Leave already applied for this period" });
    }

    const response = await Leave.create({
      userId,
      startDate,
      endDate,
      reason,
    });

    // Send notification to the manager
    const manager = await User.findById(user.managers[0]);
    if (manager && manager.fcmToken) {
      await sendNotification(
        manager.fcmToken,
        "New Leave Request",
        `${user.name} applied for leave.`
      );
      console.log(`Notification sent to ${manager.name}`);
    }

    const hr = await User.findOne({ role: "hr" });
    if (hr && hr.fcmToken) {
      await sendNotification(
        hr.fcmToken,
        "New Leave Request",
        `${user.name} applied for leave.`
      );
      console.log(`Notification sent to ${hr.name}`);
    }

    const ceo = await User.findOne({ role: "ceo" });
    if (ceo && ceo.fcmToken) {
      await sendNotification(
        ceo.fcmToken,
        "New Leave Request",
        `${user.name} applied for leave.`
      );
      console.log(`Notification sent to ${ceo.name}`);
    }

    res.status(201).json({
      message: "Leave applied successfully",
      leave: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const userId = req.user;
    const leaves = await Leave.find({ userId })
      .populate("userId", "name email")
      .populate("approvals.manager.approver", "name email")
      .populate("approvals.hr.approver", "name email")
      .populate("approvals.ceo.approver", "name email");
    if (!leaves) {
      return res.status(404).json({ message: "No leaves found" });
    }
    res.status(200).json(leaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.approveLeave = async (req, res) => {
  try {
    const { leaveId, status, comment } = req.body;
    const userId = req.user;

    // Check if the leave exists
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // Check if the user is an approver
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // if (!["manager", "hr", "ceo"].includes(user.role)) {
    //   return res
    //     .status(403)
    //     .json({ message: "You are not authorized to approve this leave" });
    // }

    const applicant = await User.findById(leave.userId);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    if (user.role === "manager") {
      // Check if approver (manager) is assigned to this applicant
      const isAssignedManager = applicant.managers.some(
        (managerId) => managerId.toString() === userId.toString()
      );
      if (!isAssignedManager) {
        return res
          .status(403)
          .json({ message: "You are not authorized to approve this leave" });
      }
    } else if (!["hr", "ceo"].includes(user.role)) {
      // If not manager, hr, or ceo, then unauthorized
      return res
        .status(403)
        .json({ message: "You are not authorized to approve this leave" });
    }

    // Update the leave status based on the approver's role
    if (user.role === "manager") {
      leave.approvals.manager.status = status;
      leave.approvals.manager.comment = comment;
      leave.approvals.manager.approver = userId;
    } else if (user.role === "hr") {
      leave.approvals.hr.status = status;
      leave.approvals.hr.comment = comment;
      leave.approvals.hr.approver = userId;
    } else if (user.role === "ceo") {
      leave.approvals.ceo.status = status;
      leave.approvals.ceo.comment = comment;
      leave.approvals.ceo.approver = userId;
    }

    // Check if all approvals are done
    const allApproved =
      leave.approvals.manager.status === "approved" &&
      leave.approvals.hr.status === "approved" &&
      leave.approvals.ceo.status === "approved";

    if (allApproved) {
      leave.finalStatus = "approved";
    }

    // Save the leave
    await leave.save();

    res
      .status(200)
      .json({ message: "Leave approval updated successfully", leave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTeamLeaves = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is a manager
    const isManager = user.role === "manager";
    if (!isManager) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view team leaves" });
    }

    // Get the team members
    const teamMembers = await User.find({ managers: userId });
    if (!teamMembers || teamMembers.length === 0) {
      return res.status(404).json({ message: "No team members found" });
    }

    // Get the leaves of the team members
    const leaves = await Leave.find({
      userId: { $in: teamMembers.map((member) => member._id) },
    })
      .populate("userId", "name email")
      .populate("approvals.manager.approver", "name email")
      .populate("approvals.hr.approver", "name email")
      .populate("approvals.ceo.approver", "name email");

    if (!leaves || leaves.length === 0) {
      return res.status(404).json({ message: "No leaves found" });
    }

    res.status(200).json(leaves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
