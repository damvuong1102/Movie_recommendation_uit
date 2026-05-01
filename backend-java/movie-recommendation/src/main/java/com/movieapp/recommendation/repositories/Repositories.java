package com.movieapp.recommendation.repositories;

import com.movieapp.recommendation.entity.Movie;
import com.movieapp.recommendation.entity.Rating;
import com.movieapp.recommendation.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// ── UserRepository ─────────────────────────────────────────────────
@Repository
interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}

// ── MovieRepository ────────────────────────────────────────────────
@Repository
interface MovieRepository extends JpaRepository<Movie, Long> {

    // Search by title (case-insensitive)
    Page<Movie> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    // Filter by genre
    Page<Movie> findByGenresContainingIgnoreCase(String genre, Pageable pageable);

    // Top rated (avgRating desc, ratingCount min threshold)
    @Query(
        "SELECT m FROM Movie m WHERE m.ratingCount >= :minRatings ORDER BY m.avgRating DESC"
    )
    Page<Movie> findTopRated(@Param("minRatings") long minRatings, Pageable pageable);

    // Trending (most ratings recently)
    @Query(
        "SELECT m FROM Movie m WHERE m.ratingCount >= :minRatings ORDER BY m.popularity DESC"
    )
    Page<Movie> findTrending(@Param("minRatings") long minRatings, Pageable pageable);

    Optional<Movie> findByTmdbId(Long tmdbId);
    Optional<Movie> findByMovielensId(Long movielensId);

    // Update denormalized avg rating after new rating submitted
    @Modifying
    @Query(
        "UPDATE Movie m SET" +
            " m.avgRating   = (SELECT AVG(r.rating) FROM Rating r WHERE r.movie = m)," +
            " m.ratingCount = (SELECT COUNT(r)      FROM Rating r WHERE r.movie = m)" +
            " WHERE m.id = :movieId"
        )
    void recalculateRating(@Param("movieId") Long movieId);
}

// ── RatingRepository ───────────────────────────────────────────────
@Repository
interface RatingRepository extends JpaRepository<Rating, Long> {

    Optional<Rating> findByUserAndMovie(User user, Movie movie);

    Optional<Rating> findByUser_IdAndMovie_Id(Long userId, Long movieId);

    Page<Rating> findByUser_Id(Long userId, Pageable pageable);

    Page<Rating> findByMovie_Id(Long movieId, Pageable pageable);

    boolean existsByUser_IdAndMovie_Id(Long userId, Long movieId);

    void deleteByUser_IdAndMovie_Id(Long userId, Long movieId);

    @Query("SELECT AVG(r.rating) FROM Rating r WHERE r.movie.id = :movieId")
    Optional<Double> findAvgRatingByMovieId(@Param("movieId") Long movieId);

    @Query("SELECT COUNT(r) FROM Rating r WHERE r.movie.id = :movieId")
    long countByMovieId(@Param("movieId") Long movieId);
}