package com.movieapp.recommendation.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.util.List;

@Component
public class TmdbApiClient {

    private final RestClient restClient;
    private final String apiKey;
    private final boolean bearerAuthEnabled;

    public TmdbApiClient(
            @Value("${tmdb.api.base-url:https://api.themoviedb.org/3}") String baseUrl,
            @Value("${tmdb.api.access-token:}") String accessToken,
            @Value("${tmdb.api.key:}") String apiKey) {
        this.apiKey = apiKey;
        this.bearerAuthEnabled = StringUtils.hasText(accessToken);

        RestClient.Builder builder = RestClient.builder().baseUrl(baseUrl);
        if (bearerAuthEnabled) {
            builder.defaultHeader("Authorization", "Bearer " + accessToken);
        }

        this.restClient = builder.build();
    }

    public TmdbSearchResponse searchMovies(String query) {
        return searchMovies(query, 1);
    }

    public TmdbSearchResponse searchMovies(String query, int page) {
        if (!StringUtils.hasText(query)) {
            throw new IllegalArgumentException("Search query must not be blank");
        }

        return get(authenticated("/search/movie")
                .queryParam("query", query)
                .queryParam("page", normalizePage(page))
                .queryParam("include_adult", false), TmdbSearchResponse.class);
    }

    public TmdbSearchResponse getPopularMovies(int page) {
        return get(authenticated("/movie/popular")
                .queryParam("page", normalizePage(page)), TmdbSearchResponse.class);
    }

    public TmdbSearchResponse getTrendingMovies() {
        return getTrendingMovies("week");
    }

    public TmdbSearchResponse getTrendingMovies(String timeWindow) {
        String normalizedTimeWindow = "day".equalsIgnoreCase(timeWindow) ? "day" : "week";

        return get(authenticated("/trending/movie/" + normalizedTimeWindow), TmdbSearchResponse.class);
    }

    public TmdbMovieDetail getMovieDetails(long tmdbId) {
        if (tmdbId <= 0) {
            throw new IllegalArgumentException("TMDB movie id must be positive");
        }

        return get(authenticated("/movie/" + tmdbId), TmdbMovieDetail.class);
    }

    public TmdbMovieAssets getMovieAssets(long tmdbId) {
        TmdbMovieDetail movie = getMovieDetails(tmdbId);
        return TmdbMovieAssets.from(movie, buildImageUrl(movie.posterPath()), buildImageUrl(movie.backdropPath(), "w1280"));
    }

    public String buildImageUrl(String imagePath) {
        return buildImageUrl(imagePath, "w500");
    }

    public String buildImageUrl(String imagePath, String size) {
        if (!StringUtils.hasText(imagePath)) {
            return null;
        }

        String normalizedPath = imagePath.startsWith("/") ? imagePath : "/" + imagePath;
        String normalizedSize = StringUtils.hasText(size) ? size : "w500";
        return "https://image.tmdb.org/t/p/" + normalizedSize + normalizedPath;
    }

    private <T> T get(UriComponentsBuilder uriBuilder, Class<T> responseType) {
        ensureAuthenticationConfigured();

        try {
            return restClient.get()
                    .uri(uriBuilder.build().encode().toUriString())
                    .retrieve()
                    .body(responseType);
        } catch (RestClientException ex) {
            throw new TmdbClientException("Failed to call TMDB API", ex);
        }
    }

    private UriComponentsBuilder authenticated(String path) {
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromPath(path);
        if (!bearerAuthEnabled) {
            uriBuilder.queryParam("api_key", apiKey);
        }
        return uriBuilder;
    }

    private void ensureAuthenticationConfigured() {
        if (!bearerAuthEnabled && !StringUtils.hasText(apiKey)) {
            throw new IllegalStateException(
                    "TMDB authentication is not configured. Set tmdb.api.access-token or tmdb.api.key.");
        }
    }

    private int normalizePage(int page) {
        return Math.max(page, 1);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TmdbSearchResponse(
            int page,
            List<TmdbMovieSummary> results,
            @JsonProperty("total_pages") int totalPages,
            @JsonProperty("total_results") int totalResults) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TmdbMovieSummary(
            long id,
            String title,
            String overview,
            @JsonProperty("poster_path") String posterPath,
            @JsonProperty("backdrop_path") String backdropPath,
            @JsonProperty("release_date") LocalDate releaseDate,
            @JsonProperty("genre_ids") List<Integer> genreIds,
            @JsonProperty("vote_average") double voteAverage,
            @JsonProperty("vote_count") int voteCount,
            double popularity,
            @JsonProperty("original_language") String originalLanguage) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TmdbMovieDetail(
            long id,
            String title,
            String overview,
            @JsonProperty("poster_path") String posterPath,
            @JsonProperty("backdrop_path") String backdropPath,
            @JsonProperty("release_date") LocalDate releaseDate,
            List<TmdbGenre> genres,
            @JsonProperty("vote_average") double voteAverage,
            @JsonProperty("vote_count") int voteCount,
            double popularity,
            int runtime,
            @JsonProperty("original_language") String originalLanguage) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TmdbGenre(int id, String name) {
    }

    public record TmdbMovieAssets(
            long tmdbId,
            String title,
            String overview,
            String posterPath,
            String posterUrl,
            String backdropPath,
            String backdropUrl,
            LocalDate releaseDate,
            List<TmdbGenre> genres,
            Integer runtimeMinutes,
            String originalLanguage,
            double popularity,
            int voteCount) {

        private static TmdbMovieAssets from(TmdbMovieDetail movie, String posterUrl, String backdropUrl) {
            return new TmdbMovieAssets(
                    movie.id(),
                    movie.title(),
                    movie.overview(),
                    movie.posterPath(),
                    posterUrl,
                    movie.backdropPath(),
                    backdropUrl,
                    movie.releaseDate(),
                    movie.genres(),
                    movie.runtime(),
                    movie.originalLanguage(),
                    movie.popularity(),
                    movie.voteCount());
        }
    }

    public static class TmdbClientException extends RuntimeException {
        public TmdbClientException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
