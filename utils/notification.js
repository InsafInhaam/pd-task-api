const admin = require("firebase-admin");

const sendNotification = async (tokens, title, body) => {
  const message = {
    notification: {
      title,
      body,
    },
    token: tokens, // You wrote fcmToken but you passed tokens
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Notifications sent successfully:", response);
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};

module.exports = { sendNotification };
