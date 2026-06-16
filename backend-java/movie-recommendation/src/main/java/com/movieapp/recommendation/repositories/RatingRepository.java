package com.movieapp.recommendation.repositories;

import com.movieapp.recommendation.entity.Movie;
import com.movieapp.recommendation.entity.Rating;
import com.movieapp.recommendation.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {

    Optional<Rating> findByUserAndMovie(User user, Movie movie);

    Optional<Rating> findByIdAndUser_Id(Long id, Long userId);

    Optional<Rating> findByUser_IdAndMovie_Id(Long userId, Long movieId);

    Page<Rating> findByUser_Id(Long userId, Pageable pageable);

    Page<Rating> findByMovie_IdOrderByUpdatedAtDesc(Long movieId, Pageable pageable);

    boolean existsByUser_IdAndMovie_Id(Long userId, Long movieId);

    void deleteByUser_IdAndMovie_Id(Long userId, Long movieId);

    @Query("SELECT AVG(r.rating) FROM Rating r WHERE r.movie.id = :movieId")
    Optional<Double> findAvgRatingByMovieId(@Param("movieId") Long movieId);

    @Query("SELECT COUNT(r) FROM Rating r WHERE r.movie.id = :movieId")
    long countByMovieId(@Param("movieId") Long movieId);

    @Query("SELECT r FROM Rating r JOIN FETCH r.user JOIN FETCH r.movie")
    List<Rating> findAllWithUserAndMovie();
}
