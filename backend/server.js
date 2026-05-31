const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs-extra");
const sendReminderEmail = require("./services/emailService");

const userRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

const dataDir = path.join(__dirname, "data");
fs.ensureDirSync(dataDir);

const usersFile = path.join(dataDir, "users.json");
const tasksFile = path.join(dataDir, "tasks.json");

if (!fs.existsSync(usersFile)) fs.writeJsonSync(usersFile, []);
if (!fs.existsSync(tasksFile)) fs.writeJsonSync(tasksFile, []);

app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

// Manual email trigger from frontend
app.post("/api/send-reminder", async (req, res) => {
  const { email, taskTitle, taskDescription, deadline, time, userName } = req.body;
  if (!email || !taskTitle) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  try {
    await sendReminderEmail(
      email,
      { title: taskTitle, description: taskDescription, deadline, time },
      userName
    );
    res.json({ success: true, message: "Reminder email sent successfully" });
  } catch (error) {
    console.error("Email sending error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send email", error: error.message });
  }
});

// Test endpoint
app.get("/api/test-email-config", (req, res) => {
  res.json({
    hasApiKey: !!process.env.BREVO_API_KEY,
    hasSenderEmail: !!process.env.SENDER_EMAIL,
    senderEmail: process.env.SENDER_EMAIL,
    frontendUrl: process.env.FRONTEND_URL
  });
});

// ✅ Automatic deadline checker — runs every 60 seconds on the backend
const checkDeadlines = async () => {
  try {
    const tasks = await fs.readJson(tasksFile);
    const users = await fs.readJson(usersFile);
    const now = new Date();

    const updatedTasks = await Promise.all(tasks.map(async (task) => {
      if (task.completed || task.emailSent) return task;
      if (!task.deadline || !task.time) return task;

      const deadlineDateTime = new Date(`${task.deadline}T${task.time}`);
      const diffMs = deadlineDateTime - now;
      const diffMinutes = diffMs / (1000 * 60);

      // Send email when deadline is reached (within a 1 minute window)
      if (diffMinutes <= 0 && diffMinutes > -1) {
        const user = users.find(u => u.uid === task.userId);
        if (user?.email) {
          try {
            await sendReminderEmail(user.email, task, user.name);
            console.log(`Deadline email sent for task: ${task.title}`);
            return { ...task, emailSent: true };
          } catch (err) {
            console.error(`Failed to send email for task ${task.title}:`, err.message);
          }
        }
      }
      return task;
    }));

    await fs.writeJson(tasksFile, updatedTasks);
  } catch (err) {
    console.error("Deadline checker error:", err.message);
  }
};

// Run deadline checker every 60 seconds
setInterval(checkDeadlines, 60 * 1000);
console.log("Deadline checker started — running every 60 seconds");

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Sending emails from: ${process.env.SENDER_EMAIL}`);
});