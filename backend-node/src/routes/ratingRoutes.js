const express = require("express");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { ok, errorResponse } = require("../utils/apiResponse");
const { firstExistingColumn, hasColumn } = require("../utils/dbMeta");

const router = express.Router();

function mapRating(row) {
  return {
    id: row.id || row.rating_id || `${row.user_id}:${row.movie_id}`,
    userId: row.user_id,
    username: row.username || null,
    movieId: row.movie_id,
    tmdbId: row.tmdb_id || null,
    movieTitle: row.movie_title || row.title || null,
    rating: Number(row.rating),
    review: row.review || null,
    ratingTime: row.rating_time || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

async function recalculateMovieRating(movieId) {
  if (!(await hasColumn("movies", "avg_rating")) || !(await hasColumn("movies", "rating_count"))) {
    return;
  }

  await pool.query(
    `
      UPDATE movies
      SET avg_rating = COALESCE(stats.avg_rating, 0),
          rating_count = COALESCE(stats.rating_count, 0)
      FROM (
        SELECT AVG(rating)::numeric(3, 2) AS avg_rating, COUNT(*)::bigint AS rating_count
        FROM ratings
        WHERE movie_id = $1
      ) stats
      WHERE movie_id = $1
    `,
    [movieId]
  );
}

async function findMovieId({ movieId, tmdbId }) {
  if (movieId) {
    const result = await pool.query("SELECT movie_id FROM movies WHERE movie_id = $1 LIMIT 1", [movieId]);
    if (!result.rows.length) {
      const error = new Error("Movie not found");
      error.status = 404;
      throw error;
    }
    return result.rows[0].movie_id;
  }

  if (!tmdbId) {
    const error = new Error("movieId or tmdbId is required");
    error.status = 400;
    throw error;
  }

  const existing = await pool.query("SELECT movie_id FROM movies WHERE tmdb_id = $1 LIMIT 1", [tmdbId]);
  if (existing.rows.length) {
    return existing.rows[0].movie_id;
  }

  const title = `TMDB ${tmdbId}`;
  const insert = await pool.query(
    `
      INSERT INTO movies (movie_id, tmdb_id, title, genres)
      VALUES ($1, $1, $2, NULL)
      ON CONFLICT (movie_id) DO UPDATE SET tmdb_id = EXCLUDED.tmdb_id
      RETURNING movie_id
    `,
    [tmdbId, title]
  );
  return insert.rows[0].movie_id;
}

async function ratingSelectSql(whereSql = "") {
  const idColumn = await firstExistingColumn("ratings", ["id", "rating_id"]);
  const reviewColumn = await firstExistingColumn("ratings", ["review"]);
  const createdAtColumn = await firstExistingColumn("ratings", ["created_at"]);
  const updatedAtColumn = await firstExistingColumn("ratings", ["updated_at"]);

  return `
    SELECT
      ${idColumn ? `r.${idColumn}` : "NULL"} AS id,
      r.user_id,
      u.username,
      r.movie_id,
      m.tmdb_id,
      m.title AS movie_title,
      r.rating,
      r.rating_time,
      ${reviewColumn ? "r.review" : "NULL"} AS review,
      ${createdAtColumn ? `r.${createdAtColumn}` : "NULL"} AS created_at,
      ${updatedAtColumn ? `r.${updatedAtColumn}` : "NULL"} AS updated_at
    FROM ratings r
    JOIN movies m ON m.movie_id = r.movie_id
    LEFT JOIN users u ON u.user_id = r.user_id
    ${whereSql}
  `;
}

router.get("/ratings", async (req, res, next) => {
  try {
    const params = [];
    const conditions = [];

    if (req.query.userId) {
      params.push(req.query.userId);
      conditions.push(`r.user_id = $${params.length}`);
    }

    if (req.query.movieId) {
      params.push(req.query.movieId);
      conditions.push(`r.movie_id = $${params.length}`);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = await ratingSelectSql(`${whereSql} ORDER BY r.rating_time DESC NULLS LAST LIMIT 100`);
    const result = await pool.query(sql, params);

    res.json(ok(result.rows.map(mapRating)));
  } catch (error) {
    next(error);
  }
});

router.post("/ratings", requireAuth, async (req, res, next) => {
  try {
    const { movieId, tmdbId, rating, review } = req.body;
    const numericRating = Number(rating);

    if (Number.isNaN(numericRating) || numericRating < 0.5 || numericRating > 5) {
      res.status(400).json(errorResponse("rating must be between 0.5 and 5"));
      return;
    }

    const resolvedMovieId = await findMovieId({ movieId, tmdbId });
    const hasReview = await hasColumn("ratings", "review");
    const hasUpdatedAt = await hasColumn("ratings", "updated_at");
    const hasCreatedAt = await hasColumn("ratings", "created_at");
    const hasRatingId = await firstExistingColumn("ratings", ["id", "rating_id"]);

    const columns = ["user_id", "movie_id", "rating", "rating_time"];
    const values = [req.user.user_id, resolvedMovieId, numericRating, Math.floor(Date.now() / 1000)];

    if (hasReview) {
      columns.push("review");
      values.push(review || null);
    }
    if (hasCreatedAt) {
      columns.push("created_at");
      values.push(new Date());
    }
    if (hasUpdatedAt) {
      columns.push("updated_at");
      values.push(new Date());
    }

    const updates = ["rating = EXCLUDED.rating", "rating_time = EXCLUDED.rating_time"];
    if (hasReview) {
      updates.push("review = EXCLUDED.review");
    }
    if (hasUpdatedAt) {
      updates.push("updated_at = NOW()");
    }

    await pool.query(
      `
        INSERT INTO ratings (${columns.join(", ")})
        VALUES (${values.map((_, index) => `$${index + 1}`).join(", ")})
        ON CONFLICT (user_id, movie_id)
        DO UPDATE SET ${updates.join(", ")}
      `,
      values
    );

    await recalculateMovieRating(resolvedMovieId);

    const sql = await ratingSelectSql("WHERE r.user_id = $1 AND r.movie_id = $2 LIMIT 1");
    const result = await pool.query(sql, [req.user.user_id, resolvedMovieId]);

    res.json(ok(mapRating({ ...result.rows[0], id: result.rows[0].id || hasRatingId }), "Rating saved"));
  } catch (error) {
    next(error);
  }
});

router.put("/ratings/:id", requireAuth, async (req, res, next) => {
  try {
    const numericRating = Number(req.body.rating);
    if (Number.isNaN(numericRating) || numericRating < 0.5 || numericRating > 5) {
      res.status(400).json(errorResponse("rating must be between 0.5 and 5"));
      return;
    }

    const reviewColumn = await firstExistingColumn("ratings", ["review"]);
    const updatedAtColumn = await firstExistingColumn("ratings", ["updated_at"]);
    const idColumn = await firstExistingColumn("ratings", ["id", "rating_id"]);
    const params = [numericRating];
    const updates = ["rating = $1", "rating_time = EXTRACT(EPOCH FROM NOW())::int"];

    if (reviewColumn) {
      params.push(req.body.review || null);
      updates.push(`review = $${params.length}`);
    }
    if (updatedAtColumn) {
      updates.push("updated_at = NOW()");
    }

    let whereSql;
    if (idColumn && !String(req.params.id).includes(":")) {
      params.push(req.params.id, req.user.user_id);
      whereSql = `${idColumn} = $${params.length - 1} AND user_id = $${params.length}`;
    } else {
      const [, movieId] = String(req.params.id).split(":");
      params.push(req.user.user_id, movieId);
      whereSql = `user_id = $${params.length - 1} AND movie_id = $${params.length}`;
    }

    const update = await pool.query(
      `UPDATE ratings SET ${updates.join(", ")} WHERE ${whereSql} RETURNING movie_id`,
      params
    );
    if (!update.rows.length) {
      res.status(404).json(errorResponse("Rating not found"));
      return;
    }

    await recalculateMovieRating(update.rows[0].movie_id);
    const sql = await ratingSelectSql("WHERE r.user_id = $1 AND r.movie_id = $2 LIMIT 1");
    const result = await pool.query(sql, [req.user.user_id, update.rows[0].movie_id]);
    res.json(ok(mapRating(result.rows[0]), "Rating updated"));
  } catch (error) {
    next(error);
  }
});

router.delete("/ratings/:id", requireAuth, async (req, res, next) => {
  try {
    const idColumn = await firstExistingColumn("ratings", ["id", "rating_id"]);
    const params = [];
    let whereSql;

    if (idColumn && !String(req.params.id).includes(":")) {
      params.push(req.params.id, req.user.user_id);
      whereSql = `${idColumn} = $1 AND user_id = $2`;
    } else {
      const [, movieId] = String(req.params.id).split(":");
      params.push(req.user.user_id, movieId);
      whereSql = "user_id = $1 AND movie_id = $2";
    }

    const result = await pool.query(`DELETE FROM ratings WHERE ${whereSql} RETURNING movie_id`, params);
    if (!result.rows.length) {
      res.status(404).json(errorResponse("Rating not found"));
      return;
    }

    await recalculateMovieRating(result.rows[0].movie_id);
    res.json(ok(null, "Rating deleted"));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
