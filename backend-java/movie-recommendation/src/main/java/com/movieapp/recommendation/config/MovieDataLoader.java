package com.movieapp.recommendation.config;

import com.movieapp.recommendation.entity.Movie;
import com.movieapp.recommendation.repositories.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.server.context.WebServerInitializedEvent;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.sql.PreparedStatement;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Component
@RequiredArgsConstructor
public class MovieDataLoader {
    private static final int SEED_BATCH_SIZE = 500;

    private final MovieRepository movieRepository;
    private final ResourceLoader resourceLoader;
    private final TransactionTemplate transactionTemplate;
    private final JdbcTemplate jdbcTemplate;
    private final AtomicBoolean started = new AtomicBoolean(false);

    @Value("${app.dataset.movies-path:classpath:movies_ready_for_db.csv}")
    private String moviesPath;

    @Value("${app.dataset.ratings-path:classpath:ratings.csv}")
    private String ratingsPath;

    @Value("${app.data-loader.enabled:false}")
    private boolean dataLoaderEnabled;

    @EventListener
    public void onWebServerInitialized(WebServerInitializedEvent event) {
        if (!dataLoaderEnabled) {
            log.info("Movie data loader is disabled.");
            return;
        }

        if (!started.compareAndSet(false, true)) {
            return;
        }

        Thread loaderThread = new Thread(this::runSafely, "movie-data-loader");
        loaderThread.setDaemon(true);
        loaderThread.start();
    }

    private void runSafely() {
        try {
            runLoader();
        } catch (IOException ex) {
            log.error("Movie data loader failed while reading seed files. The application will continue running.", ex);
        } catch (Exception ex) {
            log.error("Movie data loader failed. The application will continue running.", ex);
        }
    }

    private void runLoader() throws IOException {
        Map<Long, RatingStats> ratingStats = loadRatingStats();

        if (movieRepository.count() > 0) {
            backfillRatingBaselines(ratingStats);
            log.info("Skipping movie seed because movies table already has data.");
            return;
        }

        MovieSeedSource seedSource = openMovieSeedSource();
        if (seedSource == null) {
            log.warn("Movie seed file not found at {}. Set app.dataset.movies-path to seed movies.", moviesPath);
            return;
        }

        try (BufferedReader reader = seedSource.reader()) {
            List<Movie> movies = loadMovies(reader, ratingStats);
            saveMoviesInBatches(movies);
            log.info("Seeded {} movies from {}.", movies.size(), seedSource.description());
        }
    }

    private void saveMoviesInBatches(List<Movie> movies) {
        int total = movies.size();
        for (int start = 0; start < total; start += SEED_BATCH_SIZE) {
            int end = Math.min(start + SEED_BATCH_SIZE, total);
            List<Movie> batch = movies.subList(start, end);

            Integer inserted = transactionTemplate.execute(status -> insertMovieBatch(batch));

            log.info("Seeded movie batch {}/{} (inserted {}).", end, total, inserted == null ? 0 : inserted);
        }
    }

    private int insertMovieBatch(List<Movie> movies) {
        String sql = """
                INSERT INTO movies (
                    avg_rating,
                    baseline_avg_rating,
                    baseline_rating_count,
                    genres,
                    movielens_id,
                    rating_count,
                    title,
                    tmdb_id,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (movielens_id) DO NOTHING
                """;

        int[][] results = jdbcTemplate.batchUpdate(sql, movies, movies.size(), this::bindMovieInsert);
        int inserted = 0;
        for (int[] batchResults : results) {
            for (int result : batchResults) {
                if (result > 0) {
                    inserted += result;
                }
            }
        }

        return inserted;
    }

    private void bindMovieInsert(PreparedStatement statement, Movie movie) throws java.sql.SQLException {
        statement.setDouble(1, movie.getAvgRating());
        statement.setDouble(2, movie.getBaselineAvgRating());
        statement.setLong(3, movie.getBaselineRatingCount());
        statement.setString(4, movie.getGenres());
        statement.setObject(5, movie.getMovielensId());
        statement.setLong(6, movie.getRatingCount());
        statement.setString(7, movie.getTitle());
        statement.setObject(8, movie.getTmdbId());
    }

    private Map<Long, RatingStats> loadRatingStats() throws IOException {
        MovieSeedSource seedSource = openSeedSource(ratingsPath);
        if (seedSource == null) {
            log.warn("Rating seed file not found at {}. Seeded movies will start with avgRating 0.0.", ratingsPath);
            return Map.of();
        }

        Map<Long, RatingStats> stats = new HashMap<>();
        try (BufferedReader reader = seedSource.reader()) {
            String header = reader.readLine();
            if (header == null) {
                return stats;
            }

            String line;
            while ((line = reader.readLine()) != null) {
                List<String> columns = parseCsvLine(line);
                if (columns.size() < 3) {
                    continue;
                }

                Long movielensId = parseLong(columns.get(1));
                Double rating = parseDouble(columns.get(2));
                if (movielensId == null || rating == null) {
                    continue;
                }

                stats.computeIfAbsent(movielensId, ignored -> new RatingStats()).add(rating);
            }
        }

        log.info("Loaded rating baselines for {} movies from {}.", stats.size(), seedSource.description());
        return stats;
    }

    private void backfillRatingBaselines(Map<Long, RatingStats> ratingStats) {
        if (ratingStats.isEmpty()) {
            return;
        }

        int updated = 0;
        for (Map.Entry<Long, RatingStats> entry : ratingStats.entrySet()) {
            Movie movie = movieRepository.findByMovielensId(entry.getKey()).orElse(null);
            if (movie == null) {
                continue;
            }

            RatingStats stats = entry.getValue();
            movie.setBaselineAvgRating(stats.average());
            movie.setBaselineRatingCount(stats.count());
            movieRepository.recalculateRating(movie.getId());
            updated++;
        }

        log.info("Backfilled rating baselines from CSV for {} movies.", updated);
    }

    private MovieSeedSource openMovieSeedSource() throws IOException {
        return openSeedSource(moviesPath);
    }

    private MovieSeedSource openSeedSource(String path) throws IOException {
        if (path.contains(":")) {
            Resource resource = resourceLoader.getResource(path);
            if (!resource.exists()) {
                return null;
            }

            return new MovieSeedSource(
                    resource.getDescription(),
                    new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)));
        }

        Path csvPath = Paths.get(path).toAbsolutePath().normalize();
        if (!Files.exists(csvPath)) {
            return null;
        }

        return new MovieSeedSource(csvPath.toString(), Files.newBufferedReader(csvPath, StandardCharsets.UTF_8));
    }

    private List<Movie> loadMovies(BufferedReader reader, Map<Long, RatingStats> ratingStats) throws IOException {
        List<Movie> movies = new ArrayList<>();
        Set<Long> movielensIds = new HashSet<>();
        Set<Long> tmdbIds = new HashSet<>();

        String header = reader.readLine();
        if (header == null) {
            return movies;
        }

        String line;
        while ((line = reader.readLine()) != null) {
            List<String> columns = parseCsvLine(line);
            if (columns.size() < 4 || !StringUtils.hasText(columns.get(1))) {
                continue;
            }

            Long movielensId = parseLong(columns.get(0));
            Long tmdbId = parseLong(columns.get(3));
            if (isDuplicate(movielensId, movielensIds) || isDuplicate(tmdbId, tmdbIds)) {
                log.debug("Skipping duplicate movie seed row: {}", line);
                continue;
            }

            RatingStats stats = ratingStats.getOrDefault(movielensId, RatingStats.empty());

            movies.add(Movie.builder()
                    .movielensId(movielensId)
                    .title(columns.get(1).trim())
                    .genres(blankToNull(columns.get(2)))
                    .tmdbId(tmdbId)
                    .avgRating(stats.average())
                    .ratingCount(stats.count())
                    .baselineAvgRating(stats.average())
                    .baselineRatingCount(stats.count())
                    .build());
        }

        return movies;
    }

    private static boolean isDuplicate(Long value, Set<Long> seenValues) {
        return value != null && !seenValues.add(value);
    }

    private static List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);

            if (ch == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch == ',' && !inQuotes) {
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(ch);
            }
        }

        values.add(current.toString());
        return values;
    }

    private static Long parseLong(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return Long.valueOf(value.trim());
    }

    private static Double parseDouble(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return Double.valueOf(value.trim());
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private record MovieSeedSource(String description, BufferedReader reader) {
    }

    private static final class RatingStats {
        private double sum;
        private long count;

        private static RatingStats empty() {
            return new RatingStats();
        }

        private void add(double rating) {
            sum += rating;
            count++;
        }

        private double average() {
            return count == 0 ? 0.0 : sum / count;
        }

        private long count() {
            return count;
        }
    }
}
