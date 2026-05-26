const express = require("express");

const fs = require("fs-extra");

const { v4: uuid } = require("uuid");

const auth = require("../middleware/authMiddleware");

const router = express.Router();

const tasksFile = "./data/tasks.json";

router.get("/", auth, async (req, res) => {

  const tasks = await fs.readJson(tasksFile);

  const userTasks = tasks.filter(
    task => task.userId === req.user.id
  );

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

  res.json({
    message: "Task Added"
  });

});

router.delete("/:id", auth, async (req, res) => {

  const tasks = await fs.readJson(tasksFile);

  const updatedTasks = tasks.filter(
    task => task.id !== req.params.id
  );

  await fs.writeJson(tasksFile, updatedTasks);

  res.json({
    message: "Task Deleted"
  });

});

module.exports = router;