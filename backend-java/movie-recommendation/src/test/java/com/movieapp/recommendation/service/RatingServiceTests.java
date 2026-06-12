package com.movieapp.recommendation.service;

import com.movieapp.recommendation.entity.Movie;
import com.movieapp.recommendation.entity.User;
import com.movieapp.recommendation.repositories.MovieRepository;
import com.movieapp.recommendation.repositories.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:rating_service_tests;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.show-sql=false"
})
class RatingServiceTests {

    @Autowired
    private RatingService ratingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void rateMovieRecalculatesAndPersistsMovieRatingStats() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User firstUser = userRepository.save(User.builder()
                .username("rating_user_a_" + suffix)
                .email("rating_user_a_" + suffix + "@example.com")
                .password("secret123")
                .build());
        User secondUser = userRepository.save(User.builder()
                .username("rating_user_b_" + suffix)
                .email("rating_user_b_" + suffix + "@example.com")
                .password("secret123")
                .build());
        Movie movie = movieRepository.save(Movie.builder()
                .title("Rating Stats Movie " + suffix)
                .avgRating(0.0)
                .ratingCount(0L)
                .build());

        ratingService.rateMovie(firstUser.getId(), new RatingService.RatingCommand(movie.getId(), null, 4.0, "Good"));
        ratingService.rateMovie(secondUser.getId(), new RatingService.RatingCommand(movie.getId(), null, 5.0, "Great"));

        entityManager.clear();
        Movie updatedMovie = movieRepository.findById(movie.getId()).orElseThrow();

        assertThat(updatedMovie.getRatingCount()).isEqualTo(2L);
        assertThat(updatedMovie.getAvgRating()).isEqualTo(4.5);
    }
}
