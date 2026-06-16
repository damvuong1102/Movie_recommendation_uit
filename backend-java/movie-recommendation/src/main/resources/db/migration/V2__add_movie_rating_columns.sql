DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'movies'
    ) THEN
        ALTER TABLE movies
            ADD COLUMN IF NOT EXISTS avg_rating DOUBLE PRECISION DEFAULT 0,
            ADD COLUMN IF NOT EXISTS rating_count BIGINT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS baseline_avg_rating DOUBLE PRECISION DEFAULT 0,
            ADD COLUMN IF NOT EXISTS baseline_rating_count BIGINT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

        UPDATE movies
        SET
            avg_rating = COALESCE(avg_rating, 0),
            rating_count = COALESCE(rating_count, 0),
            baseline_avg_rating = COALESCE(baseline_avg_rating, 0),
            baseline_rating_count = COALESCE(baseline_rating_count, 0),
            created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
            updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);
    END IF;
END $$;
