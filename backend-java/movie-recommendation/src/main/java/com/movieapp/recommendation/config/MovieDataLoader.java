package com.movieapp.recommendation.config;

import com.movieapp.recommendation.entity.Movie;
import com.movieapp.recommendation.repositories.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class MovieDataLoader implements ApplicationRunner {

    private final MovieRepository movieRepository;
    private final ResourceLoader resourceLoader;

    @Value("${app.dataset.movies-path:classpath:movies_ready_for_db.csv}")
    private String moviesPath;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (movieRepository.count() > 0) {
            log.info("Skipping movie seed because movies table already has data.");
            return;
        }

        MovieSeedSource seedSource = openMovieSeedSource();
        if (seedSource == null) {
            log.warn("Movie seed file not found at {}. Set app.dataset.movies-path to seed movies.", moviesPath);
            return;
        }

        try (BufferedReader reader = seedSource.reader()) {
            List<Movie> movies = loadMovies(reader);
            movieRepository.saveAll(movies);
            log.info("Seeded {} movies from {}.", movies.size(), seedSource.description());
        }
    }

    private MovieSeedSource openMovieSeedSource() throws IOException {
        if (moviesPath.contains(":")) {
            Resource resource = resourceLoader.getResource(moviesPath);
            if (!resource.exists()) {
                return null;
            }

            return new MovieSeedSource(
                    resource.getDescription(),
                    new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)));
        }

        Path csvPath = Paths.get(moviesPath).toAbsolutePath().normalize();
        if (!Files.exists(csvPath)) {
            return null;
        }

        return new MovieSeedSource(csvPath.toString(), Files.newBufferedReader(csvPath, StandardCharsets.UTF_8));
    }

    private List<Movie> loadMovies(BufferedReader reader) throws IOException {
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

            movies.add(Movie.builder()
                    .movielensId(movielensId)
                    .title(columns.get(1).trim())
                    .genres(blankToNull(columns.get(2)))
                    .tmdbId(tmdbId)
                    .avgRating(0.0)
                    .ratingCount(0L)
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

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private record MovieSeedSource(String description, BufferedReader reader) {
    }
}
