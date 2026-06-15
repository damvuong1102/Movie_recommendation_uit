const express = require("express");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");
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

function buildImageUrl(path, size = "w500") {
  if (!path) {
    return null;
  }

  if (String(path).startsWith("http")) {
    return path;
  }

  const normalizedPath = String(path).startsWith("/") ? path : `/${path}`;
  return `${process.env.TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p"}/${size}${normalizedPath}`;
}

async function usersSelectSql(whereSql = "") {
  const emailColumn = await firstExistingColumn("users", ["email"]);
  const displayNameColumn = await firstExistingColumn("users", ["display_name"]);
  const avatarColumn = await firstExistingColumn("users", ["avatar_url"]);
  const roleColumn = await firstExistingColumn("users", ["role"]);
  const createdAtColumn = await firstExistingColumn("users", ["created_at"]);

  return `
    SELECT
      user_id,
      username,
      ${emailColumn ? emailColumn : "NULL"} AS email,
      ${displayNameColumn ? displayNameColumn : "NULL"} AS display_name,
      ${avatarColumn ? avatarColumn : "NULL"} AS avatar_url,
      ${roleColumn ? roleColumn : "'USER'"} AS role,
      ${createdAtColumn ? createdAtColumn : "NULL"} AS created_at
    FROM users
    ${whereSql}
  `;
}

router.get("/users", async (req, res, next) => {
  try {
    const sql = await usersSelectSql("ORDER BY user_id ASC LIMIT 100");
    const result = await pool.query(sql);

    res.json(ok(result.rows.map(mapUser)));
  } catch (error) {
    next(error);
  }
});

router.get("/users/me", requireAuth, async (req, res) => {
  res.json(ok(mapUser(req.user)));
});

router.get("/users/me/history", requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page || "0", 10), 0);
    const size = Math.min(Math.max(Number.parseInt(req.query.size || "10", 10), 1), 100);
    const offset = page * size;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_movie_history (
        user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        movie_id BIGINT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
        viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, movie_id)
      )
    `);

    const posterColumn = await firstExistingColumn("movies", ["poster_path", "poster_url"]);
    const releaseDateColumn = await firstExistingColumn("movies", ["release_date"]);
    const avgColumn = await firstExistingColumn("movies", ["avg_rating"]);
    const countColumn = await firstExistingColumn("movies", ["rating_count"]);

    const countResult = await pool.query(
      "SELECT COUNT(*)::int AS total FROM user_movie_history WHERE user_id = $1",
      [req.user.user_id]
    );
    const result = await pool.query(
      `
        SELECT
          m.movie_id AS id,
          m.movie_id,
          m.tmdb_id,
          m.title,
          m.genres,
          ${posterColumn ? `m.${posterColumn}` : "NULL"} AS poster_path,
          ${releaseDateColumn ? `EXTRACT(YEAR FROM m.${releaseDateColumn})::int` : "NULL"} AS release_year,
          ${avgColumn ? `COALESCE(m.${avgColumn}, 0)::float` : "0"} AS avg_rating,
          ${countColumn ? `COALESCE(m.${countColumn}, 0)::int` : "0"} AS rating_count,
          h.viewed_at
        FROM user_movie_history h
        JOIN movies m ON m.movie_id = h.movie_id
        WHERE h.user_id = $1
        ORDER BY h.viewed_at DESC
        LIMIT $2 OFFSET $3
      `,
      [req.user.user_id, size, offset]
    );

    const totalElements = countResult.rows[0].total;
    const totalPages = Math.ceil(totalElements / size);
    res.json(ok({
      content: result.rows.map((row) => ({
        id: row.id,
        movieId: row.movie_id,
        movielensId: row.movie_id,
        tmdbId: row.tmdb_id,
        title: row.title,
        posterUrl: buildImageUrl(row.poster_path),
        genres: row.genres,
        releaseYear: row.release_year,
        avgRating: Number(row.avg_rating || 0),
        ratingCount: Number(row.rating_count || 0),
        viewedAt: row.viewed_at,
      })),
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

router.post("/users/me/history", requireAuth, async (req, res, next) => {
  try {
    const { movieId, tmdbId } = req.body;
    const lookupColumn = movieId ? "movie_id" : "tmdb_id";
    const lookupValue = movieId || tmdbId;

    if (!lookupValue) {
      res.status(400).json(errorResponse("movieId or tmdbId is required"));
      return;
    }

    const movie = await pool.query(`SELECT movie_id FROM movies WHERE ${lookupColumn} = $1 LIMIT 1`, [lookupValue]);
    if (!movie.rows.length) {
      res.status(404).json(errorResponse("Movie not found"));
      return;
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_movie_history (
        user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        movie_id BIGINT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
        viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, movie_id)
      )
    `);

    await pool.query(
      `
        INSERT INTO user_movie_history (user_id, movie_id, viewed_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id, movie_id)
        DO UPDATE SET viewed_at = EXCLUDED.viewed_at
      `,
      [req.user.user_id, movie.rows[0].movie_id]
    );

    res.json(ok(null, "History saved"));
  } catch (error) {
    next(error);
  }
});

router.get("/users/:userId", async (req, res, next) => {
  try {
    const sql = await usersSelectSql("WHERE user_id = $1");
    const result = await pool.query(sql, [req.params.userId]);

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

    const needsManualId = !(await hasColumn("users", "id"));
    const result = await pool.query(
      needsManualId
        ? `
            INSERT INTO users (user_id, username, password)
            VALUES ((SELECT COALESCE(MAX(user_id), 0) + 1 FROM users), $1, $2)
            RETURNING user_id, username
          `
        : `
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
