const express = require("express");
const fs = require("fs-extra");
const { v4: uuid } = require("uuid");
const auth = require("../middleware/authMiddleware");
const router = express.Router();
const tasksFile = "./data/tasks.json";

// Original routes (JWT protected) — kept intact
router.get("/", auth, async (req, res) => {
  const tasks = await fs.readJson(tasksFile);
  const userTasks = tasks.filter(task => task.userId === req.user.id);
  res.json(userTasks);
});

router.post("/", auth, async (req, res) => {
  const { title, deadline } = req.body;
  const tasks = await fs.readJson(tasksFile);
  const newTask = {
    id: uuid(),
    userId: req.user.id,
    title,
    deadline,
    completed: false
  };
  tasks.push(newTask);
  await fs.writeJson(tasksFile, tasks);
  res.json({ message: "Task Added" });
});

router.delete("/:id", auth, async (req, res) => {
  const tasks = await fs.readJson(tasksFile);
  const updatedTasks = tasks.filter(task => task.id !== req.params.id);
  await fs.writeJson(tasksFile, updatedTasks);
  res.json({ message: "Task Deleted" });
});

// Firebase routes — identified by Firebase uid
router.get("/firebase/:uid", async (req, res) => {
  try {
    const tasks = await fs.readJson(tasksFile);
    const userTasks = tasks.filter(task => task.userId === req.params.uid);
    res.json({ tasks: userTasks });
  } catch (err) {
    res.status(500).json({ message: "Failed to load tasks" });
  }
});

router.put("/firebase/:uid", async (req, res) => {
  try {
    const { tasks: newUserTasks } = req.body;
    const allTasks = await fs.readJson(tasksFile);
    // Remove old tasks for this user, then add updated ones
    const otherUserTasks = allTasks.filter(task => task.userId !== req.params.uid);
    const taggedTasks = newUserTasks.map(task => ({ ...task, userId: req.params.uid }));
    await fs.writeJson(tasksFile, [...otherUserTasks, ...taggedTasks]);
    res.json({ message: "Tasks saved" });
  } catch (err) {
    res.status(500).json({ message: "Failed to save tasks" });
  }
});

module.exports = router;