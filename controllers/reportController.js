const axios = require("axios");
const User = require("../models/userModel");

const TIMEDOCTOR_API_TOKEN =
  process.env.TIMEDOCTOR_API_TOKEN ||
  "14AwVSXcaFZnYtyKL-tfiR4q7SyCW9kNeP0QxjFA9rFE";

exports.getTodayTasks = async (req, res) => {
  try {
    console.log("Fetching tasks for user:", req.user);
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userEmail = user.email;
    console.log("User email:", userEmail);

    const today = new Date();
    const startOfDay = today.toISOString().split("T")[0];

    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = null;

    const jiraTasks = await fetchJiraTasks(user.jiraUserId, startDate, endDate);

    // const timeDoctorTasks = await fetchTimeDoctorTasks(userEmail, startOfDay);

    res.json({
      date: startOfDay,
      jiraTasks,
      //   timeDoctorTasks,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
  }
};

exports.getLastWeekTasks = async (req, res) => {
  try {
    console.log("Fetching last week tasks for user:", req.user);

    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userEmail = user.email;
    console.log("User email:", userEmail);

    const today = new Date();
    const endOfWeek = today.toISOString().split("T")[0]; // Today's date
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7);

    const startOfLastWeek = startOfWeek.toISOString().split("T")[0];

    const jiraTasks = await fetchJiraTasks(
      user.jiraUserId,
      startOfLastWeek,
      endOfWeek
    );
    // const timeDoctorTasks = await fetchTimeDoctorTasks(userEmail, startOfLastWeek, endOfWeek);

    res.json({
      startDate: startOfLastWeek,
      endDate: startOfWeek,
      jiraTasks,
      // timeDoctorTasks,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
  }
};

exports.getTasksByDateRange = async (req, res) => {
  try {
    console.log("Fetching tasks for date range:", req.user);
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const jiraTasks = await fetchJiraTasks(user.jiraUserId, startDate, endDate);
    // const timeDoctorTasks = await fetchTimeDoctorTasks(userEmail, startDate, endDate);

    res.json({
      startDate,
      endDate,
      jiraTasks,
    });
  } catch (error) {
    console.error("Error fetching tasks by date range:", error);
  }
};

const fetchJiraTasks = async (jiraUserId, startDate, endDate) => {
  const JIRA_DOMAIN = process.env.JIRA_DOMAIN;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;

  //   const today = new Date().toISOString().slice(0, 10);
  //   const jql = `assignee = "${jiraUserId}" AND updated >= "${today}"`;

  let jql = ``;

  if (startDate && !endDate) {
    jql = `assignee = "${jiraUserId}" AND updated >= "${startDate}"`;
  } else {
    jql = `assignee = "${jiraUserId}" AND updated >= "${startDate}" AND updated <= "${endDate}"`;
  }

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
      console.log("Issue fields:", issue.fields);
      return {
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        updated: issue.fields.updated,
        originalEstimateHours: issue.fields.timeoriginalestimate
          ? issue.fields.timeoriginalestimate / 3600
          : null,
        remainingEstimateHours: issue.fields.timeestimate
          ? issue.fields.timeestimate / 3600
          : null,
        timeSpentHours: issue.fields.timespent
          ? issue.fields.timespent / 3600
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
        // timeTracking: issue.fields.timetracking
        //   ? {
        //       originalEstimate: issue.fields.timetracking.originalEstimate,
        //       remainingEstimate: issue.fields.timetracking.remainingEstimate,
        //       timeSpent: issue.fields.timetracking.timeSpent,
        //     }
        //   : {
        //       originalEstimate: "Not yet logged",
        //       remainingEstimate: "Not yet logged",
        //       timeSpent: "Not yet logged",
        //     },
        dueDate: issue.fields.duedate,
      };
    });
  } catch (error) {}
};

const getTimeDoctorUserIdByEmail = async (email) => {
  const url = `https://api2.timedoctor.com/api/2.1/companies/me/users`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${TIMEDOCTOR_API_TOKEN}`,
        Accept: "application/json",
      },
    });

    const users = response.data?.data || [];

    console.log(users.map((u) => u.email)); // See all emails

    const user = users.find((u) => u.email === email);

    return user ? user.id : null;
  } catch (error) {
    console.error("Error fetching users:", error);
    return null;
  }
};

const fetchTimeDoctorTasks = async (email, date) => {
  const timeDoctorUserId = await getTimeDoctorUserIdByEmail(email);

  if (!timeDoctorUserId) {
    console.error("User not found with email:", email);
    return;
  }

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
