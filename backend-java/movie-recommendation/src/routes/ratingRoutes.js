const express = require("express");
const pool = require("../config/db");
const { ok, errorResponse } = require("../utils/apiResponse");

const router = express.Router();

function mapRating(row) {
  return {
    userId: row.user_id,
    movieId: row.movie_id,
    rating: Number(row.rating),
    ratingTime: row.rating_time,
  };
}

router.get("/ratings", async (req, res, next) => {
  try {
    const params = [];
    const conditions = [];

    if (req.query.userId) {
      params.push(req.query.userId);
      conditions.push(`user_id = $${params.length}`);
    }

    if (req.query.movieId) {
      params.push(req.query.movieId);
      conditions.push(`movie_id = $${params.length}`);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `
        SELECT user_id, movie_id, rating, rating_time
        FROM ratings
        ${whereSql}
        ORDER BY rating_time DESC NULLS LAST
        LIMIT 100
      `,
      params
    );

    res.json(ok(result.rows.map(mapRating)));
  } catch (error) {
    next(error);
  }
});

router.post("/ratings", async (req, res, next) => {
  try {
    const { userId, movieId, rating } = req.body;

    if (!userId || !movieId || rating === undefined) {
      res.status(400).json(errorResponse("userId, movieId and rating are required"));
      return;
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 0.5 || numericRating > 5) {
      res.status(400).json(errorResponse("rating must be between 0.5 and 5"));
      return;
    }

    const updateResult = await pool.query(
      `
        UPDATE ratings
        SET rating = $3,
            rating_time = EXTRACT(EPOCH FROM NOW())::int
        WHERE user_id = $1
          AND movie_id = $2
        RETURNING user_id, movie_id, rating, rating_time
      `,
      [userId, movieId, numericRating]
    );

    const result = updateResult.rows.length
      ? updateResult
      : await pool.query(
          `
            INSERT INTO ratings (user_id, movie_id, rating, rating_time)
            VALUES ($1, $2, $3, EXTRACT(EPOCH FROM NOW())::int)
            RETURNING user_id, movie_id, rating, rating_time
          `,
          [userId, movieId, numericRating]
        );

    res.json(ok(mapRating(result.rows[0]), "Rating saved"));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
