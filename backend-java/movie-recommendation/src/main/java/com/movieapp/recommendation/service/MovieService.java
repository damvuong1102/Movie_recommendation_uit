package com.movieapp.recommendation.service;

import com.movieapp.recommendation.client.TmdbApiClient;
import com.movieapp.recommendation.client.TmdbApiClient.TmdbClientException;
import com.movieapp.recommendation.client.TmdbApiClient.TmdbGenre;
import com.movieapp.recommendation.client.TmdbApiClient.TmdbMovieAssets;
import com.movieapp.recommendation.entity.Movie;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MovieService {

    private final EntityManager entityManager;
    private final TmdbApiClient tmdbApiClient;

    public Page<MovieSummaryResult> findMovies(String query, String genre, Pageable pageable) {
        StringBuilder whereClause = new StringBuilder(" WHERE 1 = 1");
        Map<String, Object> params = new HashMap<>();

        if (StringUtils.hasText(query)) {
            whereClause.append(" AND LOWER(m.title) LIKE LOWER(:query)");
            params.put("query", "%" + query.trim() + "%");
        }

        if (StringUtils.hasText(genre)) {
            whereClause.append(" AND LOWER(m.genres) LIKE LOWER(:genre)");
            params.put("genre", "%" + genre.trim() + "%");
        }

        String selectJpql = "SELECT m FROM Movie m" + whereClause + " ORDER BY m.title ASC";
        String countJpql = "SELECT COUNT(m) FROM Movie m" + whereClause;

        List<Movie> movies = createMovieQuery(selectJpql, params)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        Long total = createCountQuery(countJpql, params).getSingleResult();

        return toSummaryPage(movies, pageable, total);
    }

    public Page<MovieSummaryResult> findTopRated(long minRatings, Pageable pageable) {
        return findTopRated(minRatings, null, pageable);
    }

    public Page<MovieSummaryResult> findTopRated(long minRatings, String genre, Pageable pageable) {
        return findRankedMovies(
                "ORDER BY COALESCE(m.avgRating, 0) DESC, COALESCE(m.ratingCount, 0) DESC",
                genre,
                minRatings,
                pageable);
    }

    public Page<MovieSummaryResult> findTrending(long minRatings, Pageable pageable) {
        return findTrending(minRatings, null, pageable);
    }

    public Page<MovieSummaryResult> findTrending(long minRatings, String genre, Pageable pageable) {
        return findRankedMovies(
                "ORDER BY COALESCE(m.popularity, 0) DESC, COALESCE(m.ratingCount, 0) DESC",
                genre,
                minRatings,
                pageable);
    }

    public Page<MovieSummaryResult> findRecommended(Long userId, long minRatings, Pageable pageable) {
        return findRecommended(userId, minRatings, null, pageable);
    }

    public Page<MovieSummaryResult> findRecommended(Long userId, long minRatings, String genre, Pageable pageable) {
        if (userId == null) {
            return findTopRated(minRatings, genre, pageable);
        }

        List<String> favoriteGenres = findFavoriteGenres(userId);
        if (favoriteGenres.isEmpty()) {
            return findTopRated(minRatings, genre, pageable);
        }

        StringBuilder whereClause = new StringBuilder("""
                WHERE COALESCE(m.ratingCount, 0) >= :minRatings
                AND NOT EXISTS (
                    SELECT 1 FROM Rating rated
                    WHERE rated.user.id = :userId AND rated.movie = m
                )
                """);
        Map<String, Object> params = new HashMap<>();
        params.put("minRatings", Math.max(minRatings, 0));
        params.put("userId", userId);

        if (StringUtils.hasText(genre)) {
            whereClause.append(" AND LOWER(m.genres) LIKE LOWER(:selectedGenre)");
            params.put("selectedGenre", "%" + genre.trim() + "%");
        }

        whereClause.append(" AND (");
        for (int i = 0; i < favoriteGenres.size(); i++) {
            if (i > 0) {
                whereClause.append(" OR ");
            }
            String paramName = "genre" + i;
            whereClause.append("LOWER(m.genres) LIKE LOWER(:").append(paramName).append(")");
            params.put(paramName, "%" + favoriteGenres.get(i) + "%");
        }

        whereClause.append(") ORDER BY COALESCE(m.avgRating, 0) DESC, COALESCE(m.ratingCount, 0) DESC");

        List<Movie> movies = createMovieQuery("SELECT m FROM Movie m " + whereClause, params)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        Long total = createCountQuery("SELECT COUNT(m) FROM Movie m " + whereClause.substring(0, whereClause.indexOf(" ORDER BY")), params)
                .getSingleResult();

        if (total == 0) {
            return findTopRated(minRatings, genre, pageable);
        }

        return toSummaryPage(movies, pageable, total);
    }

    public List<String> findGenres() {
        List<String> genreValues = entityManager.createQuery(
                        "SELECT DISTINCT m.genres FROM Movie m WHERE m.genres IS NOT NULL AND TRIM(m.genres) <> ''",
                        String.class)
                .getResultList();

        return genreValues.stream()
                .flatMap(value -> splitGenres(value).stream())
                .collect(Collectors.toCollection(() -> new TreeSet<>(String.CASE_INSENSITIVE_ORDER)))
                .stream()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    public MovieDetailResult getMovie(Long id) {
        Movie movie = entityManager.find(Movie.class, id);
        if (movie == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found");
        }

        return enrichWithTmdb(MovieDetailResult.from(movie), movie.getTmdbId());
    }

    public MovieDetailResult getMovieByTmdbId(Long tmdbId) {
        try {
            Movie movie = entityManager.createQuery(
                            "SELECT m FROM Movie m WHERE m.tmdbId = :tmdbId",
                            Movie.class)
                    .setParameter("tmdbId", tmdbId)
                    .getSingleResult();

            return enrichWithTmdb(MovieDetailResult.from(movie), tmdbId);
        } catch (NoResultException ex) {
            return getMovieFromTmdb(tmdbId);
        }
    }

    public List<MovieSummaryResult> findSummariesByIds(List<Long> movieIds) {
        if (movieIds == null || movieIds.isEmpty()) {
            return List.of();
        }

        List<Movie> movies = entityManager.createQuery(
                        "SELECT m FROM Movie m WHERE m.id IN :movieIds",
                        Movie.class)
                .setParameter("movieIds", movieIds)
                .getResultList();

        Map<Long, Movie> moviesById = movies.stream()
                .collect(Collectors.toMap(Movie::getId, movie -> movie));

        return movieIds.stream()
                .map(moviesById::get)
                .filter(movie -> movie != null)
                .map(movie -> enrichWithTmdb(MovieSummaryResult.from(movie), movie.getTmdbId()))
                .toList();
    }

    private MovieDetailResult getMovieFromTmdb(Long tmdbId) {
        TmdbMovieAssets tmdbMovie = fetchTmdbMovie(tmdbId);
        if (tmdbMovie == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found");
        }

        return MovieDetailResult.from(tmdbMovie);
    }

    private Page<MovieSummaryResult> findRankedMovies(String orderClause, String genre, long minRatings, Pageable pageable) {
        StringBuilder whereClause = new StringBuilder("WHERE COALESCE(m.ratingCount, 0) >= :minRatings");
        Map<String, Object> params = new HashMap<>();
        params.put("minRatings", Math.max(minRatings, 0));

        if (StringUtils.hasText(genre)) {
            whereClause.append(" AND LOWER(m.genres) LIKE LOWER(:genre)");
            params.put("genre", "%" + genre.trim() + "%");
        }

        List<Movie> movies = createMovieQuery(
                        "SELECT m FROM Movie m " + whereClause + " " + orderClause,
                        params)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        Long total = createCountQuery(
                        "SELECT COUNT(m) FROM Movie m " + whereClause,
                        params)
                .getSingleResult();

        return toSummaryPage(movies, pageable, total);
    }

    private List<String> findFavoriteGenres(Long userId) {
        List<String> ratedGenres = entityManager.createQuery("""
                        SELECT r.movie.genres
                        FROM Rating r
                        WHERE r.user.id = :userId
                        AND r.movie.genres IS NOT NULL
                        AND r.rating >= 3.5
                        ORDER BY r.rating DESC, r.updatedAt DESC
                        """, String.class)
                .setParameter("userId", userId)
                .setMaxResults(20)
                .getResultList();

        Set<String> genres = new LinkedHashSet<>();
        for (String ratedGenre : ratedGenres) {
            genres.addAll(splitGenres(ratedGenre));
        }

        return new ArrayList<>(genres);
    }

    private TypedQuery<Movie> createMovieQuery(String jpql, Map<String, Object> params) {
        TypedQuery<Movie> query = entityManager.createQuery(jpql, Movie.class);
        params.forEach(query::setParameter);
        return query;
    }

    private TypedQuery<Long> createCountQuery(String jpql, Map<String, Object> params) {
        TypedQuery<Long> query = entityManager.createQuery(jpql, Long.class);
        params.forEach(query::setParameter);
        return query;
    }

    private MovieDetailResult enrichWithTmdb(MovieDetailResult movie, Long tmdbId) {
        if (tmdbId == null) {
            return movie;
        }

        TmdbMovieAssets tmdbMovie = fetchTmdbMovie(tmdbId);
        if (tmdbMovie == null) {
            return movie;
        }

        return movie.withTmdbFallback(tmdbMovie);
    }

    private MovieSummaryResult enrichWithTmdb(MovieSummaryResult movie, Long tmdbId) {
        if (tmdbId == null) {
            return movie;
        }

        TmdbMovieAssets tmdbMovie = fetchTmdbMovie(tmdbId);
        if (tmdbMovie == null) {
            return movie;
        }

        return movie.withTmdbFallback(tmdbMovie);
    }

    private TmdbMovieAssets fetchTmdbMovie(Long tmdbId) {
        if (tmdbId == null || tmdbId <= 0) {
            return null;
        }

        try {
            return tmdbApiClient.getMovieAssets(tmdbId);
        } catch (IllegalStateException | TmdbClientException ex) {
            return null;
        }
    }

    private Page<MovieSummaryResult> toSummaryPage(List<Movie> movies, Pageable pageable, long total) {
        List<MovieSummaryResult> summaries = movies.stream()
                .map(MovieSummaryResult::from)
                .map(this::enrichSummaryWhenNeeded)
                .toList();

        return new PageImpl<>(summaries, pageable, total);
    }

    private MovieSummaryResult enrichSummaryWhenNeeded(MovieSummaryResult movie) {
        if (StringUtils.hasText(movie.posterUrl()) || movie.tmdbId() == null || !tmdbApiClient.isAuthenticationConfigured()) {
            return movie;
        }

        return enrichWithTmdb(movie, movie.tmdbId());
    }

    private static String firstText(String preferred, String fallback) {
        return StringUtils.hasText(preferred) ? preferred : fallback;
    }

    private static <T> T firstValue(T preferred, T fallback) {
        return preferred != null ? preferred : fallback;
    }

    public static String genreNames(List<TmdbGenre> genres) {
        if (genres == null || genres.isEmpty()) {
            return null;
        }

        String value = genres.stream()
                .map(TmdbGenre::name)
                .filter(StringUtils::hasText)
                .collect(Collectors.joining(", "));

        return StringUtils.hasText(value) ? value : null;
    }

    private static List<String> splitGenres(String genres) {
        if (!StringUtils.hasText(genres)) {
            return List.of();
        }

        String normalized = genres
                .replace("[", "")
                .replace("]", "")
                .replace("\"", "");

        return Arrays.stream(normalized.split("[|,]"))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    public record MovieSummaryResult(
            Long id,
            Long tmdbId,
            String title,
            String posterUrl,
            String genres,
            Integer releaseYear,
            Double avgRating,
            Long ratingCount) {

        private static MovieSummaryResult from(Movie movie) {
            LocalDate releaseDate = movie.getReleaseDate();
            return new MovieSummaryResult(
                    movie.getId(),
                    movie.getTmdbId(),
                    movie.getTitle(),
                    movie.getFullPosterUrl(),
                    movie.getGenres(),
                    releaseDate == null ? null : releaseDate.getYear(),
                    movie.getAvgRating(),
                    movie.getRatingCount());
        }

        private MovieSummaryResult withTmdbFallback(TmdbMovieAssets movie) {
            return new MovieSummaryResult(
                    id,
                    tmdbId,
                    firstText(title, movie.title()),
                    firstText(posterUrl, movie.posterUrl()),
                    firstText(genres, genreNames(movie.genres())),
                    releaseYear != null || movie.releaseDate() == null ? releaseYear : movie.releaseDate().getYear(),
                    avgRating,
                    ratingCount);
        }
    }

    public record MovieDetailResult(
            Long id,
            Long tmdbId,
            Long movielensId,
            String title,
            String overview,
            String posterUrl,
            String backdropUrl,
            String genres,
            LocalDate releaseDate,
            String originalLanguage,
            Integer runtimeMinutes,
            Double avgRating,
            Long ratingCount,
            Double popularity,
            Integer voteCount) {

        private static MovieDetailResult from(Movie movie) {
            return new MovieDetailResult(
                    movie.getId(),
                    movie.getTmdbId(),
                    movie.getMovielensId(),
                    movie.getTitle(),
                    movie.getOverview(),
                    movie.getFullPosterUrl(),
                    movie.getFullBackdropUrl(),
                    movie.getGenres(),
                    movie.getReleaseDate(),
                    movie.getOriginalLanguage(),
                    movie.getRuntimeMinutes(),
                    movie.getAvgRating(),
                    movie.getRatingCount(),
                    movie.getPopularity(),
                    movie.getVoteCount());
        }

        private static MovieDetailResult from(TmdbMovieAssets movie) {
            return new MovieDetailResult(
                    null,
                    movie.tmdbId(),
                    null,
                    movie.title(),
                    movie.overview(),
                    movie.posterUrl(),
                    movie.backdropUrl(),
                    genreNames(movie.genres()),
                    movie.releaseDate(),
                    movie.originalLanguage(),
                    movie.runtimeMinutes(),
                    null,
                    null,
                    movie.popularity(),
                    movie.voteCount());
        }

        private MovieDetailResult withTmdbFallback(TmdbMovieAssets movie) {
            return new MovieDetailResult(
                    id,
                    tmdbId,
                    movielensId,
                    firstText(title, movie.title()),
                    firstText(overview, movie.overview()),
                    firstText(posterUrl, movie.posterUrl()),
                    firstText(backdropUrl, movie.backdropUrl()),
                    firstText(genres, genreNames(movie.genres())),
                    firstValue(releaseDate, movie.releaseDate()),
                    firstText(originalLanguage, movie.originalLanguage()),
                    firstValue(runtimeMinutes, movie.runtimeMinutes()),
                    avgRating,
                    ratingCount,
                    firstValue(popularity, movie.popularity()),
                    firstValue(voteCount, movie.voteCount()));
        }
    }
}
