const express = require("express");
const cors = require("cors");
require("./src/config/env");

const pool = require("./src/config/db");
const movieRoutes = require("./src/routes/movieRoutes");
const ratingRoutes = require("./src/routes/ratingRoutes");
const userRoutes = require("./src/routes/userRoutes");
const { errorResponse } = require("./src/utils/apiResponse");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Movie Recommendation API is running");
});

app.get("/health", async (req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

app.use("/api", movieRoutes);
app.use("/api", ratingRoutes);
app.use("/api", userRoutes);

app.use((req, res) => {
  res.status(404).json(errorResponse("Route not found"));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json(errorResponse(error.message || "Internal server error"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
