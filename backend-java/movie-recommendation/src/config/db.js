const { Pool } = require("pg");
require("./env");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

module.exports = pool;
