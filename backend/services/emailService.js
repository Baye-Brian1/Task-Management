const { BrevoClient } = require("@getbrevo/brevo");
const dotenv = require("dotenv");
dotenv.config();

const client = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY
});

const sendReminderEmail = async (email, task, userName) => {
  await client.transactionalEmails.sendTransacEmail({
    subject: `⏰ Task Reminder: "${task.title}" is due now!`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: black; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .task-details { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .deadline { color: #ff4444; font-weight: bold; }
          .btn { background: black; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin-top: 15px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>⏰ Taski Reminder</h1></div>
          <div class="content">
            <p>Hello <strong>${userName || "User"}</strong>,</p>
            <p>Your task deadline has been reached!</p>
            <div class="task-details">
              <h3>📋 ${task.title}</h3>
              ${task.description ? `<p>${task.description}</p>` : ""}
              <p class="deadline">Due: ${task.deadline} at ${task.time}</p>
            </div>
            <p>Please check your task manager and take action.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Open Taski</a>
          </div>
          <div style="text-align:center; margin-top:20px; font-size:12px; color:#999;">
            <p>This is an automated reminder from Taski.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    sender: {
      name: "Taski Reminders",
      email: process.env.SENDER_EMAIL
    },
    to: [{ email }]
  });

  console.log(`Email sent to ${email} for task: ${task.title}`);
};

module.exports = sendReminderEmail;