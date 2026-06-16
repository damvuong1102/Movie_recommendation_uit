package com.movieapp.recommendation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "ratings",
    uniqueConstraints = {
        // One user can only rate each movie once
        @UniqueConstraint(name = "uk_user_movie", columnNames = {"user_id", "movie_id"})
    },
    indexes = {
        @Index(name = "idx_rating_user_id",    columnList = "user_id"),
        @Index(name = "idx_rating_movie_id",   columnList = "movie_id"),
        @Index(name = "idx_rating_value",      columnList = "rating"),
        @Index(name = "idx_rating_created_at", columnList = "created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Foreign Keys ───────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    // ── Rating Value ───────────────────────────────────────────
    // MovieLens uses 0.5 increments (0.5 – 5.0)
    @DecimalMin("0.5")
    @DecimalMax("5.0")
    @Column(nullable = false, precision = 2)
    private Double rating;

    @Column(columnDefinition = "TEXT")
    private String review;

    // ── Timestamp ─────────────────────────────────────────────
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Timestamp from original MovieLens dataset (Unix epoch)
    @Column(name = "movielens_timestamp")
    private Long movielensTimestamp;

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
}
