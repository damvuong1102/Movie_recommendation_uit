const express = require("express");
const pool = require("../config/db");
const { ok, errorResponse } = require("../utils/apiResponse");

const router = express.Router();

function toPositiveInt(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function mapMovie(row) {
  return {
    id: row.id,
    movieId: row.movie_id,
    movielensId: row.movie_id,
    tmdbId: row.tmdb_id,
    title: row.title,
    genres: row.genres,
    avgRating: Number(row.avg_rating || 0),
    ratingCount: Number(row.rating_count || 0),
  };
}

router.get("/movies", async (req, res, next) => {
  try {
    const page = toPositiveInt(req.query.page, 0);
    const size = toPositiveInt(req.query.size, 20, 100);
    const offset = page * size;
    const minRatings = toPositiveInt(req.query.minRatings, 0);
    const type = String(req.query.type || "").replace(/[_-]/g, "").toLowerCase();

    const conditions = [];
    const params = [];

    if (req.query.query) {
      params.push(`%${req.query.query}%`);
      conditions.push(`m.title ILIKE $${params.length}`);
    }

    if (req.query.genre) {
      params.push(`%${req.query.genre}%`);
      conditions.push(`m.genres ILIKE $${params.length}`);
    }

    params.push(minRatings);
    conditions.push(`COALESCE(stats.rating_count, 0) >= $${params.length}`);

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderSql = type === "toprated"
      ? "ORDER BY avg_rating DESC, rating_count DESC, m.title ASC"
      : "ORDER BY rating_count DESC, avg_rating DESC, m.title ASC";

    const baseSql = `
      FROM movies m
      LEFT JOIN (
        SELECT movie_id, AVG(rating)::float AS avg_rating, COUNT(*)::int AS rating_count
        FROM ratings
        GROUP BY movie_id
      ) stats ON stats.movie_id = m.movie_id
      ${whereSql}
    `;

    const countResult = await pool.query(`SELECT COUNT(*)::int AS total ${baseSql}`, params);

    const dataParams = [...params, size, offset];
    const dataResult = await pool.query(
      `
        SELECT
          m.movie_id AS id,
          m.movie_id,
          m.tmdb_id,
          m.title,
          m.genres,
          COALESCE(stats.avg_rating, 0) AS avg_rating,
          COALESCE(stats.rating_count, 0) AS rating_count
        ${baseSql}
        ${orderSql}
        LIMIT $${dataParams.length - 1}
        OFFSET $${dataParams.length}
      `,
      dataParams
    );

    const totalElements = countResult.rows[0].total;
    const totalPages = Math.ceil(totalElements / size);

    res.json(ok({
      content: dataResult.rows.map(mapMovie),
      page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: totalPages === 0 || page >= totalPages - 1,
    }));
  } catch (error) {
    next(error);
  }
});

async function getMovieByTmdbId(req, res, next) {
  try {
    const result = await pool.query(
      `
        SELECT
          m.movie_id AS id,
          m.movie_id,
          m.tmdb_id,
          m.title,
          m.genres,
          COALESCE(AVG(r.rating), 0)::float AS avg_rating,
          COUNT(r.*)::int AS rating_count
        FROM movies m
        LEFT JOIN ratings r ON r.movie_id = m.movie_id
        WHERE m.tmdb_id = $1
        GROUP BY m.movie_id, m.tmdb_id, m.title, m.genres
      `,
      [req.params.tmdbId]
    );

    if (!result.rows.length) {
      res.status(404).json(errorResponse("Movie not found"));
      return;
    }

    res.json(ok(mapMovie(result.rows[0])));
  } catch (error) {
    next(error);
  }
}

router.get("/movies/tmdb/:tmdbId", getMovieByTmdbId);
router.get("/movies/:tmdbId", getMovieByTmdbId);

router.get("/genres", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT genres FROM movies WHERE genres IS NOT NULL");
    const genres = new Set();

    for (const row of result.rows) {
      String(row.genres)
        .split(/[|,]/)
        .map((genre) => genre.trim())
        .filter(Boolean)
        .forEach((genre) => genres.add(genre));
    }

    res.json(ok([...genres].sort()));
  } catch (error) {
    next(error);
  }
});

router.get("/recommendations/:userId", async (req, res, next) => {
  try {
    const limit = Math.min(toPositiveInt(req.query.limit, 10), 100);
    const result = await pool.query(
      `
        SELECT
          m.movie_id AS id,
          m.movie_id,
          m.tmdb_id,
          m.title,
          m.genres,
          COALESCE(AVG(r.rating), 0)::float AS avg_rating,
          COUNT(r.*)::int AS rating_count
        FROM movies m
        LEFT JOIN ratings r ON r.movie_id = m.movie_id
        WHERE NOT EXISTS (
          SELECT 1
          FROM ratings user_rating
          WHERE user_rating.user_id = $1
            AND user_rating.movie_id = m.movie_id
        )
        GROUP BY m.movie_id, m.tmdb_id, m.title, m.genres
        ORDER BY avg_rating DESC, rating_count DESC, m.title ASC
        LIMIT $2
      `,
      [req.params.userId, limit]
    );

    res.json(ok(result.rows.map(mapMovie)));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
