const express = require("express");
const pool = require("../config/db");
const { ok, errorResponse } = require("../utils/apiResponse");

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

    const movies = await Promise.all(result.rows.map((row) => mapMovieWithAssets(row)));
    res.json(ok(movies));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
