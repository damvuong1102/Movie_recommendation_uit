package com.movieapp.recommendation.repositories;

import com.movieapp.recommendation.entity.Movie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {

    Page<Movie> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    Page<Movie> findByGenresContainingIgnoreCase(String genre, Pageable pageable);

    @Query("SELECT m FROM Movie m WHERE m.ratingCount >= :minRatings ORDER BY m.avgRating DESC")
    Page<Movie> findTopRated(@Param("minRatings") long minRatings, Pageable pageable);

    @Query("SELECT m FROM Movie m WHERE m.ratingCount >= :minRatings ORDER BY m.popularity DESC")
    Page<Movie> findTrending(@Param("minRatings") long minRatings, Pageable pageable);

    Optional<Movie> findByTmdbId(Long tmdbId);

    Optional<Movie> findByMovielensId(Long movielensId);

    @Modifying(flushAutomatically = true)
    @Query(
            "UPDATE Movie m SET" +
                    " m.avgRating = CASE WHEN (COALESCE(m.baselineRatingCount, 0) + (SELECT COUNT(r) FROM Rating r WHERE r.movie = m)) = 0" +
                    " THEN 0.0 ELSE ((COALESCE(m.baselineAvgRating, 0.0) * COALESCE(m.baselineRatingCount, 0))" +
                    " + COALESCE((SELECT SUM(r.rating) FROM Rating r WHERE r.movie = m), 0.0))" +
                    " / (COALESCE(m.baselineRatingCount, 0) + (SELECT COUNT(r) FROM Rating r WHERE r.movie = m)) END," +
                    " m.ratingCount = COALESCE(m.baselineRatingCount, 0) + (SELECT COUNT(r) FROM Rating r WHERE r.movie = m)," +
                    " m.updatedAt = CURRENT_TIMESTAMP" +
                    " WHERE m.id = :movieId"
    )
    int recalculateRating(@Param("movieId") Long movieId);
}
