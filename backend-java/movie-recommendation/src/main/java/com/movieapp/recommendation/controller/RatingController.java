package com.movieapp.recommendation.controller;

import com.movieapp.recommendation.entity.User;
import com.movieapp.recommendation.service.RatingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping("/ratings")
    public ResponseEntity<ApiResponse<RatingService.RatingResult>> rateMovie(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody RatingRequest request) {

        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }

        RatingService.RatingCommand command = new RatingService.RatingCommand(
                request.movieId(),
                request.tmdbId(),
                request.rating(),
                request.review());

        return ResponseEntity.ok(ApiResponse.ok("Rating saved", ratingService.rateMovie(user.getId(), command)));
    }

    @GetMapping("/movies/{movieId}/ratings")
    public ResponseEntity<ApiResponse<PageResponse<RatingService.RatingResult>>> getMovieRatings(
            @PathVariable Long movieId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {

        Page<RatingService.RatingResult> ratings = ratingService.findMovieRatings(
                movieId,
                PageRequest.of(page, size));

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(ratings)));
    }

    public record RatingRequest(
            Long movieId,
            Long tmdbId,

            @NotNull(message = "Rating is required")
            @DecimalMin(value = "1.0", message = "Rating must be at least 1")
            @DecimalMax(value = "5.0", message = "Rating must be at most 5")
            Double rating,

            String review) {
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

        private static <T> ApiResponse<T> ok(String message, T data) {
            return new ApiResponse<>(true, message, data, LocalDateTime.now());
        }

        private static <T> ApiResponse<T> ok(T data) {
            return new ApiResponse<>(true, null, data, LocalDateTime.now());
        }
    }
}
