package com.movieapp.recommendation.controller;

import com.movieapp.recommendation.service.MovieService;
import com.movieapp.recommendation.service.RecommendationService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/recommendations/{userId}")
    public ResponseEntity<ApiResponse<List<MovieService.MovieSummaryResult>>> getRecommendations(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int limit) {

        return ResponseEntity.ok(ApiResponse.ok(recommendationService.getRecommendations(userId, limit)));
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
