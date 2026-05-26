const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const SibApiV3Sdk = require("@getbrevo/brevo");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Email sending endpoint
app.post("/api/send-reminder", async (req, res) => {
  const { email, taskTitle, deadline } = req.body;
  
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  apiInstance.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;
  
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = "⏰ Task Deadline Reminder";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #667eea;">Task Deadline Reminder</h2>
      <p>Your task <strong>"${taskTitle}"</strong> has reached its deadline!</p>
      <p>Deadline: ${new Date(deadline).toLocaleString()}</p>
      <p>Please complete this task as soon as possible.</p>
      <hr style="margin: 20px 0;" />
      <p style="color: #666; font-size: 12px;">This is an automated reminder from TaskFlow.</p>
    </div>
  `;
  sendSmtpEmail.sender = { name: "TaskFlow", email: "your-verified-email@domain.com" };
  sendSmtpEmail.to = [{ email }];
  
  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});