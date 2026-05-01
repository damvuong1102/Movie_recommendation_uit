package com.movieapp.recommendation.dto;

// =====================================================================
// AUTH DTOs
// =====================================================================

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// ── Request DTOs ───────────────────────────────────────────────────

class LoginRequest {
    @NotBlank(message = "Username is required")
    public String username;

    @NotBlank(message = "Password is required")
    public String password;
}

class RegisterRequest {
    @NotBlank
    @Size(min = 3, max = 50)
    public String username;

    @NotBlank
    @Email
    public String email;

    @NotBlank
    @Size(min = 6, max = 100)
    public String password;

    public String displayName;
}

// ── Response DTOs ──────────────────────────────────────────────────

@Data @Builder @NoArgsConstructor @AllArgsConstructor
class AuthResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long expiresIn;          // seconds
    private UserSummary user;
}

@Data @Builder @NoArgsConstructor @AllArgsConstructor
class UserSummary {
    private Long id;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String role;
    private LocalDateTime createdAt;
}

// =====================================================================
// MOVIE DTOs
// =====================================================================

@Data @Builder @NoArgsConstructor @AllArgsConstructor
class MovieSummary {
    // Used in Home page lists (lightweight)
    private Long id;
    private Long tmdbId;
    private String title;
    private String posterUrl;
    private String genres;
    private Integer releaseYear;
    private Double avgRating;
    private Long ratingCount;
}

@Data @Builder @NoArgsConstructor @AllArgsConstructor
class MovieDetail {
    // Used in Detail page (full data)
    private Long id;
    private Long tmdbId;
    private Long movielensId;
    private String title;
    private String overview;
    private String posterUrl;
    private String backdropUrl;
    private String genres;
    private LocalDate releaseDate;
    private String originalLanguage;
    private Integer runtimeMinutes;
    private Double avgRating;
    private Long ratingCount;
    private Double popularity;

    // Current user's rating (null if not rated)
    private Double myRating;
    private String myReview;
}

// =====================================================================
// RATING DTOs
// =====================================================================

@Data @NoArgsConstructor @AllArgsConstructor
class RatingRequest {
    @NotNull
    @DecimalMin("0.5") @DecimalMax("5.0")
    public Double rating;

    @Size(max = 1000)
    public String review;
}

@Data @Builder @NoArgsConstructor @AllArgsConstructor
class RatingResponse {
    private Long id;
    private Long userId;
    private String username;
    private Long movieId;
    private String movieTitle;
    private Double rating;
    private String review;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

// =====================================================================
// PAGINATION WRAPPER
// =====================================================================

@Data @Builder @NoArgsConstructor @AllArgsConstructor
class PageResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
}

// =====================================================================
// STANDARD API RESPONSE ENVELOPE
// =====================================================================

@Data @Builder @NoArgsConstructor @AllArgsConstructor
class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .message(message)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
            .success(false)
            .message(message)
            .timestamp(LocalDateTime.now())
            .build();
    }
}