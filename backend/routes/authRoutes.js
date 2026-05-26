const express = require("express");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const fs = require("fs-extra");

const { v4: uuid } = require("uuid");

const router = express.Router();

const usersFile = "./data/users.json";

router.post("/register", async (req, res) => {

  const { name, email, password } = req.body;

  const users = await fs.readJson(usersFile);

  const existingUser = users.find(
    user => user.email === email
  );

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists"
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: uuid(),
    name,
    email,
    password: hashedPassword
  };

  users.push(newUser);

  await fs.writeJson(usersFile, users);

  res.json({
    message: "Registration Successful"
  });

});

router.post("/login", async (req, res) => {

  const { email, password } = req.body;

  const users = await fs.readJson(usersFile);

  const user = users.find(
    user => user.email === email
  );

  if (!user) {
    return res.status(400).json({
      message: "Invalid credentials"
    });
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isMatch) {
    return res.status(400).json({
      message: "Invalid credentials"
    });
  }

  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET
  );

  res.json({
    token,
    user
  });

});

module.exports = router;