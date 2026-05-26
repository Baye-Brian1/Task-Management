const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const SibApiV3Sdk = require("@getbrevo/brevo");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Check if API key is loaded
console.log("Brevo API Key loaded:", process.env.BREVO_API_KEY ? "Yes" : "No");
console.log("Sender Email:", process.env.SENDER_EMAIL);

// Initialize Brevo API
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;

// Email sending endpoint
app.post("/api/send-reminder", async (req, res) => {
  const { email, taskTitle, taskDescription, deadline, time, userName } = req.body;
  
  if (!email || !taskTitle) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.subject = `⏰ Task Reminder: ${taskTitle} is due soon!`;
    
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: black; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .task-details { background: #f5f5f5; padding: 15px; margin: 15px 0; }
          .deadline { color: #ff4444; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Taski Reminder</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${userName || "User"}</strong>,</p>
            <p>This is a reminder that your task is approaching its deadline.</p>
            
            <div class="task-details">
              <h3>📋 ${taskTitle}</h3>
              ${taskDescription ? `<p>${taskDescription}</p>` : ''}
              <p class="deadline">⏰ Due: ${new Date(deadline).toLocaleDateString()} at ${time}</p>
            </div>
            
            <p>Please complete this task before the deadline.</p>
            
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background: black; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin-top: 15px;">
              View Dashboard
            </a>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>This is an automated reminder from Taski.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    sendSmtpEmail.sender = {
      name: "Taski Reminders",
      email: process.env.SENDER_EMAIL
    };
    
    sendSmtpEmail.to = [{ email }];
    
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully to:", email);
    res.json({ success: true, message: "Reminder email sent successfully" });
    
  } catch (error) {
    console.error("Email sending error:", error.response?.body || error.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send email reminder",
      error: error.message 
    });
  }
});

// Test endpoint to check email configuration
app.get("/api/test-email-config", (req, res) => {
  res.json({
    hasApiKey: !!process.env.BREVO_API_KEY,
    hasSenderEmail: !!process.env.SENDER_EMAIL,
    senderEmail: process.env.SENDER_EMAIL,
    frontendUrl: process.env.FRONTEND_URL
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Brevo email service ready - Sending from: ${process.env.SENDER_EMAIL}`);
});