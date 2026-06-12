CREATE TABLE IF NOT EXISTS movies (
  movie_id BIGINT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  genres TEXT,
  tmdb_id BIGINT UNIQUE,
  avg_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  rating_count BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ratings (
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  movie_id BIGINT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
  rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5),
  rating_time BIGINT,
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_movies_title ON movies USING gin (to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies (genres);
CREATE INDEX IF NOT EXISTS idx_movies_avg_rating ON movies (avg_rating);
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings (movie_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings (user_id);
