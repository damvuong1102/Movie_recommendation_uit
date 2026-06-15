package com.movieapp.recommendation.service;

import com.movieapp.recommendation.client.TmdbApiClient;
import com.movieapp.recommendation.client.TmdbApiClient.TmdbClientException;
import com.movieapp.recommendation.client.TmdbApiClient.TmdbMovieAssets;
import com.movieapp.recommendation.entity.Movie;
import com.movieapp.recommendation.entity.Rating;
import com.movieapp.recommendation.entity.User;
import com.movieapp.recommendation.repositories.MovieRepository;
import com.movieapp.recommendation.repositories.RatingRepository;
import com.movieapp.recommendation.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final RatingRepository ratingRepository;
    private final TmdbApiClient tmdbApiClient;

    @Transactional
    public RatingResult rateMovie(Long userId, RatingCommand command) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Movie movie = findOrCreateMovie(command.movieId(), command.tmdbId());

        Rating rating = ratingRepository.findByUserAndMovie(user, movie)
                .orElseGet(() -> Rating.builder()
                        .user(user)
                        .movie(movie)
                        .build());

        rating.setRating(command.rating());
        rating.setReview(command.review());

        Rating savedRating = ratingRepository.saveAndFlush(rating);
        movieRepository.recalculateRating(movie.getId());

        return RatingResult.from(savedRating);
    }

    @Transactional(readOnly = true)
    public Page<RatingResult> findMovieRatings(Long movieId, Pageable pageable) {
        if (!movieRepository.existsById(movieId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found");
        }

        return ratingRepository.findByMovie_IdOrderByUpdatedAtDesc(movieId, pageable)
                .map(RatingResult::from);
    }

    private Movie findOrCreateMovie(Long movieId, Long tmdbId) {
        if (movieId != null) {
            return movieRepository.findById(movieId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
        }

        if (tmdbId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "movieId or tmdbId is required");
        }

        return movieRepository.findByTmdbId(tmdbId)
                .orElseGet(() -> createMovieFromTmdb(tmdbId));
    }

    private Movie createMovieFromTmdb(Long tmdbId) {
        TmdbMovieAssets tmdbMovie;
        try {
            tmdbMovie = tmdbApiClient.getMovieAssets(tmdbId);
        } catch (IllegalArgumentException | IllegalStateException | TmdbClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Cannot fetch movie from TMDB", ex);
        }

        Movie movie = Movie.builder()
                .tmdbId(tmdbMovie.tmdbId())
                .title(tmdbMovie.title())
                .overview(tmdbMovie.overview())
                .posterPath(tmdbMovie.posterPath())
                .backdropPath(tmdbMovie.backdropPath())
                .releaseDate(tmdbMovie.releaseDate())
                .genres(MovieService.genreNames(tmdbMovie.genres()))
                .runtimeMinutes(tmdbMovie.runtimeMinutes())
                .originalLanguage(tmdbMovie.originalLanguage())
                .popularity(tmdbMovie.popularity())
                .voteCount(tmdbMovie.voteCount())
                .avgRating(0.0)
                .ratingCount(0L)
                .build();

        return movieRepository.save(movie);
    }

    public record RatingCommand(
            Long movieId,
            Long tmdbId,
            Double rating,
            String review) {
    }

    public record RatingResult(
            Long id,
            Long userId,
            String username,
            Long movieId,
            Long tmdbId,
            String movieTitle,
            Double rating,
            String review,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        private static RatingResult from(Rating rating) {
            User user = rating.getUser();
            Movie movie = rating.getMovie();
            String displayName = user.getDisplayName() == null || user.getDisplayName().isBlank()
                    ? user.getUsername()
                    : user.getDisplayName();

            return new RatingResult(
                    rating.getId(),
                    user.getId(),
                    displayName,
                    movie.getId(),
                    movie.getTmdbId(),
                    movie.getTitle(),
                    rating.getRating(),
                    rating.getReview(),
                    rating.getCreatedAt(),
                    rating.getUpdatedAt());
        }
    }
}
