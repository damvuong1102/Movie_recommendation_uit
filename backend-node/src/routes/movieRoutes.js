const express = require("express");
const pool = require("../config/db");
const { optionalAuth } = require("../middleware/auth");
const { ok, errorResponse } = require("../utils/apiResponse");
const { firstExistingColumn } = require("../utils/dbMeta");

const router = express.Router();

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p";
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const tmdbMovieCache = new Map();

function toPositiveInt(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function tmdbAuthenticationConfigured() {
  return Boolean(TMDB_ACCESS_TOKEN || TMDB_API_KEY);
}

function buildImageUrl(path, size = "w500") {
  if (!path) {
    return null;
  }

  const normalizedPath = String(path).startsWith("/") ? path : `/${path}`;
  return `${TMDB_IMAGE_BASE_URL}/${size}${normalizedPath}`;
}

async function fetchTmdbMovie(tmdbId) {
  if (!tmdbId || !tmdbAuthenticationConfigured()) {
    return null;
  }

  const cacheKey = String(tmdbId);
  if (tmdbMovieCache.has(cacheKey)) {
    return tmdbMovieCache.get(cacheKey);
  }

  const url = new URL(`${TMDB_BASE_URL.replace(/\/$/, "")}/movie/${tmdbId}`);
  const headers = {};

  if (TMDB_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${TMDB_ACCESS_TOKEN}`;
  } else {
    url.searchParams.set("api_key", TMDB_API_KEY);
  }

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.warn(`TMDB request failed for ${tmdbId}: ${response.status}`);
      return null;
    }

    const movie = await response.json();
    const assets = {
      title: movie.title,
      overview: movie.overview,
      posterUrl: buildImageUrl(movie.poster_path, "w500"),
      backdropUrl: buildImageUrl(movie.backdrop_path, "w1280"),
      releaseDate: movie.release_date || null,
      releaseYear: movie.release_date ? Number(movie.release_date.slice(0, 4)) : null,
      runtimeMinutes: movie.runtime || null,
      originalLanguage: movie.original_language || null,
      popularity: movie.popularity ?? null,
      voteCount: movie.vote_count ?? null,
      genres: Array.isArray(movie.genres)
        ? movie.genres.map((genre) => genre.name).filter(Boolean).join(", ")
        : null,
    };

    tmdbMovieCache.set(cacheKey, assets);
    return assets;
  } catch (error) {
    console.warn(`TMDB request failed for ${tmdbId}:`, error.message);
    return null;
  }
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

async function mapMovieWithAssets(row, { detail = false } = {}) {
  const movie = mapMovie(row);
  const tmdbMovie = await fetchTmdbMovie(movie.tmdbId);

  return {
    ...movie,
    title: movie.title || tmdbMovie?.title,
    genres: movie.genres || tmdbMovie?.genres,
    posterUrl: tmdbMovie?.posterUrl || null,
    releaseYear: tmdbMovie?.releaseYear || null,
    ...(detail
      ? {
          overview: tmdbMovie?.overview || "",
          backdropUrl: tmdbMovie?.backdropUrl || null,
          releaseDate: tmdbMovie?.releaseDate || null,
          originalLanguage: tmdbMovie?.originalLanguage || null,
          runtimeMinutes: tmdbMovie?.runtimeMinutes || null,
          popularity: tmdbMovie?.popularity || null,
          voteCount: tmdbMovie?.voteCount || null,
        }
      : {}),
  };
}

async function findFavoriteGenres(userId) {
  if (!userId) {
    return [];
  }

  const result = await pool.query(
    `
      SELECT m.genres
      FROM ratings r
      JOIN movies m ON m.movie_id = r.movie_id
      WHERE r.user_id = $1
        AND r.rating >= 3.5
        AND m.genres IS NOT NULL
      ORDER BY r.rating DESC, r.rating_time DESC NULLS LAST
      LIMIT 20
    `,
    [userId]
  );

  const genres = new Set();
  for (const row of result.rows) {
    String(row.genres)
      .replace(/\[|\]|"/g, "")
      .split(/[|,]/)
      .map((genre) => genre.trim())
      .filter(Boolean)
      .forEach((genre) => genres.add(genre));
  }

  return [...genres];
}

router.get("/movies", optionalAuth, async (req, res, next) => {
  try {
    const page = toPositiveInt(req.query.page, 0);
    const size = toPositiveInt(req.query.size, 20, 100);
    const offset = page * size;
    const minRatings = toPositiveInt(req.query.minRatings, 0);
    const type = String(req.query.type || "").replace(/[_-]/g, "").toLowerCase();

    const conditions = [];
    const params = [];

    if (req.query.query && type !== "recommended") {
      params.push(`%${req.query.query}%`);
      conditions.push(`m.title ILIKE $${params.length}`);
    }

    if (req.query.genre) {
      params.push(`%${req.query.genre}%`);
      conditions.push(`m.genres ILIKE $${params.length}`);
    }

    params.push(minRatings);
    conditions.push(`COALESCE(stats.rating_count, 0) >= $${params.length}`);

    let orderSql = "ORDER BY rating_count DESC, avg_rating DESC, m.title ASC";
    if (type === "toprated" || (type === "recommended" && !req.user)) {
      orderSql = "ORDER BY avg_rating DESC, rating_count DESC, m.title ASC";
    }

    if (type === "trending") {
      const popularityColumn = await firstExistingColumn("movies", ["popularity"]);
      orderSql = popularityColumn
        ? `ORDER BY COALESCE(m.${popularityColumn}, 0) DESC, rating_count DESC, m.title ASC`
        : "ORDER BY rating_count DESC, avg_rating DESC, m.title ASC";
    }

    if (type === "recommended" && req.user) {
      const favoriteGenres = await findFavoriteGenres(req.user.user_id);

      if (favoriteGenres.length) {
        conditions.push(`NOT EXISTS (
          SELECT 1
          FROM ratings rated
          WHERE rated.user_id = $${params.length + 1}
            AND rated.movie_id = m.movie_id
        )`);
        params.push(req.user.user_id);

        const genreConditions = [];
        for (const favoriteGenre of favoriteGenres) {
          params.push(`%${favoriteGenre}%`);
          genreConditions.push(`m.genres ILIKE $${params.length}`);
        }
        conditions.push(`(${genreConditions.join(" OR ")})`);
      } else {
        orderSql = "ORDER BY avg_rating DESC, rating_count DESC, m.title ASC";
      }
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

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

    let totalElements = countResult.rows[0].total;
    if (type === "recommended" && req.user && totalElements === 0) {
      const fallbackConditions = ["COALESCE(stats.rating_count, 0) >= $1"];
      const fallbackBaseParams = [minRatings];
      if (req.query.genre) {
        fallbackBaseParams.push(`%${req.query.genre}%`);
        fallbackConditions.push(`m.genres ILIKE $${fallbackBaseParams.length}`);
      }
      const fallbackWhere = `WHERE ${fallbackConditions.join(" AND ")}`;
      const fallbackParams = [...fallbackBaseParams, size, offset];
      const fallbackCount = await pool.query(
        `
          SELECT COUNT(*)::int AS total
          FROM movies m
          LEFT JOIN (
            SELECT movie_id, AVG(rating)::float AS avg_rating, COUNT(*)::int AS rating_count
            FROM ratings
            GROUP BY movie_id
          ) stats ON stats.movie_id = m.movie_id
          ${fallbackWhere}
        `,
        fallbackBaseParams
      );

      const fallbackResult = await pool.query(
        `
          SELECT
            m.movie_id AS id,
            m.movie_id,
            m.tmdb_id,
            m.title,
            m.genres,
            COALESCE(stats.avg_rating, 0) AS avg_rating,
            COALESCE(stats.rating_count, 0) AS rating_count
          FROM movies m
          LEFT JOIN (
            SELECT movie_id, AVG(rating)::float AS avg_rating, COUNT(*)::int AS rating_count
            FROM ratings
            GROUP BY movie_id
          ) stats ON stats.movie_id = m.movie_id
          ${fallbackWhere}
          ORDER BY avg_rating DESC, rating_count DESC, m.title ASC
          LIMIT $${fallbackParams.length - 1} OFFSET $${fallbackParams.length}
        `,
        fallbackParams
      );

      totalElements = fallbackCount.rows[0].total;
      const totalPages = Math.ceil(totalElements / size);
      const movies = await Promise.all(fallbackResult.rows.map((row) => mapMovieWithAssets(row)));

      res.json(ok({
        content: movies,
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: totalPages === 0 || page >= totalPages - 1,
      }));
      return;
    }

    const totalPages = Math.ceil(totalElements / size);
    const movies = await Promise.all(dataResult.rows.map((row) => mapMovieWithAssets(row)));

    res.json(ok({
      content: movies,
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

    res.json(ok(await mapMovieWithAssets(result.rows[0], { detail: true })));
  } catch (error) {
    next(error);
  }
}

router.get("/movies/:tmdbId/ratings", async (req, res, next) => {
  try {
    const page = toPositiveInt(req.query.page, 0);
    const size = toPositiveInt(req.query.size, 20, 100);
    const offset = page * size;

    const movie = await pool.query("SELECT movie_id FROM movies WHERE tmdb_id = $1 OR movie_id = $1 LIMIT 1", [
      req.params.tmdbId,
    ]);
    if (!movie.rows.length) {
      res.status(404).json(errorResponse("Movie not found"));
      return;
    }

    const reviewColumn = await firstExistingColumn("ratings", ["review"]);
    const ratingIdColumn = await firstExistingColumn("ratings", ["id", "rating_id"]);
    const createdAtColumn = await firstExistingColumn("ratings", ["created_at"]);
    const updatedAtColumn = await firstExistingColumn("ratings", ["updated_at"]);

    const countResult = await pool.query("SELECT COUNT(*)::int AS total FROM ratings WHERE movie_id = $1", [
      movie.rows[0].movie_id,
    ]);
    const result = await pool.query(
      `
        SELECT
          ${ratingIdColumn ? `r.${ratingIdColumn}` : "NULL"} AS id,
          r.user_id,
          u.username,
          r.movie_id,
          r.rating,
          r.rating_time,
          ${reviewColumn ? "r.review" : "NULL"} AS review,
          ${createdAtColumn ? `r.${createdAtColumn}` : "NULL"} AS created_at,
          ${updatedAtColumn ? `r.${updatedAtColumn}` : "NULL"} AS updated_at
        FROM ratings r
        LEFT JOIN users u ON u.user_id = r.user_id
        WHERE r.movie_id = $1
        ORDER BY r.rating_time DESC NULLS LAST
        LIMIT $2 OFFSET $3
      `,
      [movie.rows[0].movie_id, size, offset]
    );

    const totalElements = countResult.rows[0].total;
    const totalPages = Math.ceil(totalElements / size);
    res.json(ok({
      content: result.rows.map((row) => ({
        id: row.id || `${row.user_id}:${row.movie_id}`,
        userId: row.user_id,
        username: row.username || null,
        movieId: row.movie_id,
        rating: Number(row.rating),
        review: row.review || null,
        ratingTime: row.rating_time || null,
        createdAt: row.created_at || null,
        updatedAt: row.updated_at || null,
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
    const ratingsResult = await pool.query("SELECT user_id, movie_id, rating FROM ratings");
    const matrix = new Map();
    for (const row of ratingsResult.rows) {
      const userRatings = matrix.get(String(row.user_id)) || new Map();
      userRatings.set(Number(row.movie_id), Number(row.rating));
      matrix.set(String(row.user_id), userRatings);
    }

    const targetRatings = matrix.get(String(req.params.userId));
    if (!targetRatings || targetRatings.size === 0) {
      res.json(ok([]));
      return;
    }

    const similarities = new Map();
    for (const [userId, ratings] of matrix.entries()) {
      if (userId === String(req.params.userId)) {
        continue;
      }

      let dot = 0;
      let normA = 0;
      let normB = 0;

      for (const [movieId, rating] of targetRatings.entries()) {
        if (ratings.has(movieId)) {
          dot += rating * ratings.get(movieId);
        }
        normA += rating ** 2;
      }

      for (const rating of ratings.values()) {
        normB += rating ** 2;
      }

      const similarity = normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
      if (similarity > 0) {
        similarities.set(userId, similarity);
      }
    }

    const predictions = new Map();
    for (const [neighborId, similarity] of similarities.entries()) {
      for (const [movieId, rating] of matrix.get(neighborId).entries()) {
        if (targetRatings.has(movieId)) {
          continue;
        }

        const current = predictions.get(movieId) || { weighted: 0, similarity: 0 };
        current.weighted += similarity * rating;
        current.similarity += similarity;
        predictions.set(movieId, current);
      }
    }

    const movieIds = [...predictions.entries()]
      .map(([movieId, score]) => [movieId, score.similarity ? score.weighted / score.similarity : 0])
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([movieId]) => movieId);

    if (!movieIds.length) {
      res.json(ok([]));
      return;
    }

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
        WHERE m.movie_id = ANY($1::bigint[])
        GROUP BY m.movie_id, m.tmdb_id, m.title, m.genres
      `,
      [movieIds]
    );

    const rowsById = new Map(result.rows.map((row) => [Number(row.movie_id), row]));
    const orderedRows = movieIds.map((movieId) => rowsById.get(Number(movieId))).filter(Boolean);
    const movies = await Promise.all(orderedRows.map((row) => mapMovieWithAssets(row)));
    res.json(ok(movies));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
