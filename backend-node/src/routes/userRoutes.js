const express = require("express");
const pool = require("../config/db");
const { ok, errorResponse } = require("../utils/apiResponse");

const router = express.Router();

function mapUser(row) {
  return {
    id: row.user_id,
    userId: row.user_id,
    username: row.username,
  };
}

router.get("/users", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT user_id, username FROM users ORDER BY user_id ASC LIMIT 100"
    );

    res.json(ok(result.rows.map(mapUser)));
  } catch (error) {
    next(error);
  }
});

router.get("/users/:userId", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT user_id, username FROM users WHERE user_id = $1",
      [req.params.userId]
    );

    if (!result.rows.length) {
      res.status(404).json(errorResponse("User not found"));
      return;
    }

    res.json(ok(mapUser(result.rows[0])));
  } catch (error) {
    next(error);
  }
});

router.post("/users", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json(errorResponse("username and password are required"));
      return;
    }

    const result = await pool.query(
      `
        INSERT INTO users (username, password)
        VALUES ($1, $2)
        RETURNING user_id, username
      `,
      [username, password]
    );

    res.status(201).json(ok(mapUser(result.rows[0]), "User created"));
  } catch (error) {
    if (error.code === "23505") {
      error.status = 409;
      error.message = "Username already exists";
    }

    next(error);
  }
});

module.exports = router;
