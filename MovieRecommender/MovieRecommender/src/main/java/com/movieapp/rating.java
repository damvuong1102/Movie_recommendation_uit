package com.movieapp;

import jakarta.persistence.*;

@Entity
@Table(name = "ratings")
public class rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rating_id")
    private Integer ratingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private user user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private movie movie;

    @Column(name = "rating", nullable = false)
    private Float rating;

    @Column(name = "rating_time")
    private Long ratingTime;

    // Getters & Setters
    public Integer getRatingId() { return ratingId; }
    public void setRatingId(Integer ratingId) { this.ratingId = ratingId; }

    public user getUser() { return user; }
    public void setUser(user user) { this.user = user; }

    public movie getMovie() { return movie; }
    public void setMovie(movie movie) { this.movie = movie; }

    public Float getRating() { return rating; }
    public void setRating(Float rating) { this.rating = rating; }

    public Long getRatingTime() { return ratingTime; }
    public void setRatingTime(Long ratingTime) { this.ratingTime = ratingTime; }
}