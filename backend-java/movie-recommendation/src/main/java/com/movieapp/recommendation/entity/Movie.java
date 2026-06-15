package com.movieapp.recommendation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "movies", indexes = {
    @Index(name = "idx_movie_tmdb_id",   columnList = "tmdb_id",  unique = true),
    @Index(name = "idx_movie_title",     columnList = "title"),
    @Index(name = "idx_movie_release",   columnList = "release_date"),
    @Index(name = "idx_movie_avg_rating",columnList = "avg_rating")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // MovieLens dataset ID
    @Column(name = "movielens_id", unique = true)
    private Long movielensId;

    // TMDB ID (from the Python merge script)
    @Column(name = "tmdb_id", unique = true)
    private Long tmdbId;

    @NotBlank
    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String overview;

    // Comma-separated genres from MovieLens OR JSON array from TMDB
    @Column(length = 500)
    private String genres;

    @Column(name = "poster_path", length = 300)
    private String posterPath;

    @Column(name = "backdrop_path", length = 300)
    private String backdropPath;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "original_language", length = 10)
    private String originalLanguage;

    @Column(name = "runtime_minutes")
    private Integer runtimeMinutes;

    // Denormalized avg for fast sorting on home page
    @Column(name = "avg_rating", nullable = false, precision = 3)
    @Builder.Default
    private Double avgRating = 0.0;

    @Column(name = "rating_count", nullable = false)
    @Builder.Default
    private Long ratingCount = 0L;

    @Column(name = "baseline_avg_rating", precision = 3)
    @Builder.Default
    private Double baselineAvgRating = 0.0;

    @Column(name = "baseline_rating_count")
    @Builder.Default
    private Long baselineRatingCount = 0L;

    @Column(name = "popularity")
    private Double popularity;

    @Column(name = "vote_count")
    private Integer voteCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Relationships ──────────────────────────────────────────
    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Rating> ratings;

    // ── Lifecycle ──────────────────────────────────────────────
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Helpers ────────────────────────────────────────────────
    public String getFullPosterUrl() {
        if (posterPath == null) return null;
        if (posterPath.startsWith("http")) return posterPath;
        return "https://image.tmdb.org/t/p/w500" + posterPath;
    }

    public String getFullBackdropUrl() {
        if (backdropPath == null) return null;
        if (backdropPath.startsWith("http")) return backdropPath;
        return "https://image.tmdb.org/t/p/w1280" + backdropPath;
    }
}
