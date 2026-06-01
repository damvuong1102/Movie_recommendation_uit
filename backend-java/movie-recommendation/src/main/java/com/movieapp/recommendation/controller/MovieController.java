package com.movieapp.recommendation.controller;

import com.movieapp.recommendation.entity.User;
import com.movieapp.recommendation.service.MovieService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    @GetMapping("/movies")
    public ResponseEntity<ApiResponse<PageResponse<MovieService.MovieSummaryResult>>> getMovies(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(defaultValue = "0") @Min(0) long minRatings,
            @AuthenticationPrincipal User user) {

        PageRequest pageRequest = PageRequest.of(page, size);
        Page<MovieService.MovieSummaryResult> movies = switch (normalizeType(type)) {
            case "toprated" -> movieService.findTopRated(minRatings, genre, pageRequest);
            case "trending" -> movieService.findTrending(minRatings, genre, pageRequest);
            case "recommended" -> movieService.findRecommended(user == null ? null : user.getId(), minRatings, genre, pageRequest);
            default -> movieService.findMovies(query, genre, pageRequest);
        };

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(movies)));
    }

    @GetMapping("/movies/{tmdbId}")
    public ResponseEntity<ApiResponse<MovieService.MovieDetailResult>> getMovie(@PathVariable Long tmdbId) {
        return ResponseEntity.ok(ApiResponse.ok(movieService.getMovieByTmdbId(tmdbId)));
    }

    @GetMapping("/movies/tmdb/{tmdbId}")
    public ResponseEntity<ApiResponse<MovieService.MovieDetailResult>> getMovieByTmdbId(@PathVariable Long tmdbId) {
        return ResponseEntity.ok(ApiResponse.ok(movieService.getMovieByTmdbId(tmdbId)));
    }

    @GetMapping("/genres")
    public ResponseEntity<ApiResponse<List<String>>> getGenres() {
        return ResponseEntity.ok(ApiResponse.ok(movieService.findGenres()));
    }

    private static String normalizeType(String type) {
        if (!StringUtils.hasText(type)) {
            return "";
        }

        return type.trim().replace("_", "").replace("-", "").toLowerCase();
    }

    public record PageResponse<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean first,
            boolean last) {

        private static <T> PageResponse<T> from(Page<T> page) {
            return new PageResponse<>(
                    page.getContent(),
                    page.getNumber(),
                    page.getSize(),
                    page.getTotalElements(),
                    page.getTotalPages(),
                    page.isFirst(),
                    page.isLast());
        }
    }

    public record ApiResponse<T>(
            boolean success,
            String message,
            T data,
            LocalDateTime timestamp) {

        private static <T> ApiResponse<T> ok(T data) {
            return new ApiResponse<>(true, null, data, LocalDateTime.now());
        }
    }
}
