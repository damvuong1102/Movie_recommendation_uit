const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { errorResponse } = require("../utils/apiResponse");
const { firstExistingColumn } = require("../utils/dbMeta");

const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const JWT_SECRET = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET || "dev-change-me";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || process.env.REFRESH_TOKEN_SECRET || `${JWT_SECRET}:refresh`;

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.user_id),
      username: user.username,
      role: user.role || "USER",
      type: "access",
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: String(user.user_id),
      username: user.username,
      type: "refresh",
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

function secondsFromExpiry(value) {
  const match = String(value).match(/^(\d+)([smhd])?$/i);
  if (!match) {
    return 3600;
  }

  const amount = Number(match[1]);
  const unit = (match[2] || "s").toLowerCase();
  return amount * ({ s: 1, m: 60, h: 3600, d: 86400 }[unit] || 1);
}

async function selectUserById(userId) {
  const emailColumn = await firstExistingColumn("users", ["email"]);
  const displayNameColumn = await firstExistingColumn("users", ["display_name"]);
  const avatarColumn = await firstExistingColumn("users", ["avatar_url"]);
  const roleColumn = await firstExistingColumn("users", ["role"]);
  const createdAtColumn = await firstExistingColumn("users", ["created_at"]);
  const activeColumn = await firstExistingColumn("users", ["is_active", "active"]);

  const result = await pool.query(
    `
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
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function attachUser(req, res, next, required) {
  try {
    const header = req.get("authorization") || "";
    const match = header.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      if (required) {
        res.status(401).json(errorResponse("Authentication is required"));
        return;
      }
      next();
      return;
    }

    const payload = jwt.verify(match[1], JWT_SECRET);
    const user = await selectUserById(payload.sub);

    if (!user || user.is_active === false) {
      res.status(401).json(errorResponse("Invalid token"));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (required) {
      res.status(401).json(errorResponse("Invalid or expired token"));
      return;
    }
    next();
  }
}

function requireAuth(req, res, next) {
  return attachUser(req, res, next, true);
}

function optionalAuth(req, res, next) {
  return attachUser(req, res, next, false);
}

module.exports = {
  ACCESS_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  requireAuth,
  optionalAuth,
  secondsFromExpiry,
  selectUserById,
  signAccessToken,
  signRefreshToken,
};
