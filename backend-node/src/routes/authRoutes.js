const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const {
  ACCESS_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  secondsFromExpiry,
  selectUserById,
  signAccessToken,
  signRefreshToken,
} = require("../middleware/auth");
const { ok, errorResponse } = require("../utils/apiResponse");
const { firstExistingColumn, hasColumn } = require("../utils/dbMeta");

const router = express.Router();

function mapUser(row) {
  return {
    id: row.user_id,
    userId: row.user_id,
    username: row.username,
    email: row.email || null,
    displayName: row.display_name || null,
    avatarUrl: row.avatar_url || null,
    role: row.role || "USER",
    createdAt: row.created_at || null,
  };
}

function authResponse(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    tokenType: "Bearer",
    expiresIn: secondsFromExpiry(ACCESS_EXPIRES_IN),
    user: mapUser(user),
  };
}

async function passwordMatches(candidate, stored) {
  if (!stored) {
    return false;
  }

  if (String(stored).startsWith("$2a$") || String(stored).startsWith("$2b$")) {
    return bcrypt.compare(candidate, stored);
  }

  return candidate === stored;
}

async function nextUserId() {
  const result = await pool.query("SELECT COALESCE(MAX(user_id), 0) + 1 AS next_id FROM users");
  return result.rows[0].next_id;
}

async function userSelectSql(whereSql) {
  const emailColumn = await firstExistingColumn("users", ["email"]);
  const displayNameColumn = await firstExistingColumn("users", ["display_name"]);
  const avatarColumn = await firstExistingColumn("users", ["avatar_url"]);
  const roleColumn = await firstExistingColumn("users", ["role"]);
  const createdAtColumn = await firstExistingColumn("users", ["created_at"]);
  const activeColumn = await firstExistingColumn("users", ["is_active", "active"]);

  return `
    SELECT
      user_id,
      username,
      password,
      ${emailColumn ? emailColumn : "NULL"} AS email,
      ${displayNameColumn ? displayNameColumn : "NULL"} AS display_name,
      ${avatarColumn ? avatarColumn : "NULL"} AS avatar_url,
      ${roleColumn ? roleColumn : "'USER'"} AS role,
      ${createdAtColumn ? createdAtColumn : "NULL"} AS created_at,
      ${activeColumn ? activeColumn : "TRUE"} AS is_active
    FROM users
    ${whereSql}
  `;
}

router.post("/auth/register", async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || username.length < 3 || username.length > 50) {
      res.status(400).json(errorResponse("Username must be between 3 and 50 characters"));
      return;
    }

    if (!password || password.length < 6 || password.length > 100) {
      res.status(400).json(errorResponse("Password must be between 6 and 100 characters"));
      return;
    }

    const supportsEmail = await hasColumn("users", "email");
    if (supportsEmail && !email) {
      res.status(400).json(errorResponse("Email is required"));
      return;
    }

    const duplicateParams = [username];
    let duplicateSql = "LOWER(username) = LOWER($1)";
    if (supportsEmail && email) {
      duplicateParams.push(email);
      duplicateSql += " OR LOWER(email) = LOWER($2)";
    }

    const duplicate = await pool.query(
      `SELECT username${supportsEmail ? ", email" : ""} FROM users WHERE ${duplicateSql} LIMIT 1`,
      duplicateParams
    );

    if (duplicate.rows.length) {
      const row = duplicate.rows[0];
      const message =
        supportsEmail && row.email && email && row.email.toLowerCase() === email.toLowerCase()
          ? "Email already exists"
          : "Username already exists";
      res.status(409).json(errorResponse(message));
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const columns = ["user_id", "username", "password"];
    const values = [await nextUserId(), username, hashedPassword];

    if (supportsEmail) {
      columns.push("email");
      values.push(email);
    }

    if (await hasColumn("users", "display_name")) {
      columns.push("display_name");
      values.push(displayName || null);
    }

    if (await hasColumn("users", "role")) {
      columns.push("role");
      values.push("USER");
    }

    if (await hasColumn("users", "is_active")) {
      columns.push("is_active");
      values.push(true);
    }

    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
    const inserted = await pool.query(
      `
        INSERT INTO users (${columns.join(", ")})
        VALUES (${placeholders})
        RETURNING user_id
      `,
      values
    );

    const user = await selectUserById(inserted.rows[0].user_id);
    res.status(201).json(ok(authResponse(user), "Registration successful"));
  } catch (error) {
    next(error);
  }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json(errorResponse("Username and password are required"));
      return;
    }

    const sql = await userSelectSql("WHERE LOWER(username) = LOWER($1) LIMIT 1");
    const result = await pool.query(sql, [username]);
    const user = result.rows[0];

    if (!user || user.is_active === false || !(await passwordMatches(password, user.password))) {
      res.status(401).json(errorResponse("Invalid username or password"));
      return;
    }

    res.json(ok(authResponse(user)));
  } catch (error) {
    next(error);
  }
});

router.post("/auth/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json(errorResponse("refreshToken is required"));
      return;
    }

    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    if (payload.type !== "refresh") {
      res.status(401).json(errorResponse("Invalid refresh token"));
      return;
    }

    const user = await selectUserById(payload.sub);
    if (!user || user.is_active === false) {
      res.status(401).json(errorResponse("Invalid refresh token"));
      return;
    }

    res.json(ok(authResponse(user)));
  } catch (error) {
    res.status(401).json(errorResponse("Invalid or expired refresh token"));
  }
});

router.post("/auth/logout", (req, res) => {
  res.json(ok(null, "Logged out successfully"));
});

module.exports = router;
