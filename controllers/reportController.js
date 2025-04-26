const axios = require("axios");
const User = require("../models/userModel");

exports.getTodayTasks = async (req, res) => {
  try {
    console.log("Fetching tasks for user:", req.user);
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const today = new Date();
    const startOfDay = today.toISOString().split("T")[0];

    const jiraTasks = await fetchJiraTasks(user.jiraUserId, startOfDay);

    const timeDoctorTasks = await fetchTimeDoctorTasks(
      user.timeDoctorUserId,
      startOfDay
    );

    res.json({
      date: startOfDay,
      jiraTasks,
      timeDoctorTasks,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
  }
};

const fetchJiraTasks = async (jiraUserId, date) => {
  const JIRA_DOMAIN = process.env.JIRA_DOMAIN;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;

  const today = new Date().toISOString().slice(0, 10);
  const jql = `assignee = "${jiraUserId}" AND updated >= "${today}"`;
  const url = `https://${JIRA_DOMAIN}/rest/api/3/search?jql=${encodeURIComponent(
    jql
  )}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${JIRA_EMAIL}:${JIRA_API_TOKEN}`
        ).toString("base64")}`,
        Accept: "application/json",
      },
    });

    console.log("Jira raw data:", response.data.issues);

    return response.data.issues.map((issue) => {
      return {
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        updated: issue.fields.updated,
        originalEstimateHours: issue.fields.timeoriginalestimate
          ? issue.fields.timeoriginalestimate / 3600
          : null,
        assigneeName: issue.fields.assignee
          ? issue.fields.assignee.displayName
          : null,
        reporterName: issue.fields.reporter
          ? issue.fields.reporter.displayName
          : null,
        sprint: issue.fields.customfield_10020
          ? issue.fields.customfield_10020
              .map((sprint) => sprint.name)
              .join(", ")
          : null,
        timeTracking: issue.fields.timetracking
          ? {
              originalEstimate: issue.fields.timetracking.originalEstimate,
              remainingEstimate: issue.fields.timetracking.remainingEstimate,
              timeSpent: issue.fields.timetracking.timeSpent,
            }
          : null,
        dueDate: issue.fields.duedate,
      };
    });
  } catch (error) {}
};

const fetchTimeDoctorTasks = async (timeDoctorUserId, date) => {
  const TIMEDOCTOR_API_TOKEN =
    process.env.TIMEDOCTOR_API_TOKEN ||
    "14AwVSXcaFZnYtyKL-tfiR4q7SyCW9kNeP0QxjFA9rFE";

  const url = `https://api2.timedoctor.com/api/1.1/companies/me/worklogs?user_ids=${timeDoctorUserId}&date=${date}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${TIMEDOCTOR_API_TOKEN}`,
        Accept: "application/json",
      },
    });

    return response.data.data.map((task) => ({
      taskName: task.task.name,
      projectName: task.project?.name || "",
      totalTime: task.total_time, // in seconds
    }));
  } catch (error) {
    console.error("Error fetching Time Doctor tasks:", error);
  }
};
