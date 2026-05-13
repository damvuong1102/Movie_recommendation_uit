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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

        return new PageImpl<>(movies.stream().map(MovieSummaryResult::from).toList(), pageable, total);
    }

    public Page<MovieSummaryResult> findTopRated(long minRatings, Pageable pageable) {
        return findRankedMovies(
                "WHERE COALESCE(m.ratingCount, 0) >= :minRatings ORDER BY COALESCE(m.avgRating, 0) DESC, COALESCE(m.ratingCount, 0) DESC",
                minRatings,
                pageable);
    }

    public Page<MovieSummaryResult> findTrending(long minRatings, Pageable pageable) {
        return findRankedMovies(
                "WHERE COALESCE(m.ratingCount, 0) >= :minRatings ORDER BY COALESCE(m.popularity, 0) DESC, COALESCE(m.ratingCount, 0) DESC",
                minRatings,
                pageable);
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

    private MovieDetailResult getMovieFromTmdb(Long tmdbId) {
        TmdbMovieAssets tmdbMovie = fetchTmdbMovie(tmdbId);
        if (tmdbMovie == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found");
        }

        return MovieDetailResult.from(tmdbMovie);
    }

    private Page<MovieSummaryResult> findRankedMovies(String whereAndOrderClause, long minRatings, Pageable pageable) {
        List<Movie> movies = entityManager.createQuery(
                        "SELECT m FROM Movie m " + whereAndOrderClause,
                        Movie.class)
                .setParameter("minRatings", Math.max(minRatings, 0))
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        Long total = entityManager.createQuery(
                        "SELECT COUNT(m) FROM Movie m WHERE COALESCE(m.ratingCount, 0) >= :minRatings",
                        Long.class)
                .setParameter("minRatings", Math.max(minRatings, 0))
                .getSingleResult();

        return new PageImpl<>(movies.stream().map(MovieSummaryResult::from).toList(), pageable, total);
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

    private static String firstText(String preferred, String fallback) {
        return StringUtils.hasText(preferred) ? preferred : fallback;
    }

    private static <T> T firstValue(T preferred, T fallback) {
        return preferred != null ? preferred : fallback;
    }

    private static String genreNames(List<TmdbGenre> genres) {
        if (genres == null || genres.isEmpty()) {
            return null;
        }

        String value = genres.stream()
                .map(TmdbGenre::name)
                .filter(StringUtils::hasText)
                .collect(Collectors.joining(", "));

        return StringUtils.hasText(value) ? value : null;
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
