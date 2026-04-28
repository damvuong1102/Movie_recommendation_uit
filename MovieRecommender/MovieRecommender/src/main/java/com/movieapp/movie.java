package com.movieapp;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "movies")
public class movie {

    @Id
    @Column(name = "movie_id")
    private Integer movieId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "genres", length = 255)
    private String genres;

    @Column(name = "tmdb_id", unique = true)
    private Integer tmdbId;

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<rating> ratings;

    // Getters & Setters
    public Integer getMovieId() { return movieId; }
    public void setMovieId(Integer movieId) { this.movieId = movieId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getGenres() { return genres; }
    public void setGenres(String genres) { this.genres = genres; }

    public Integer getTmdbId() { return tmdbId; }
    public void setTmdbId(Integer tmdbId) { this.tmdbId = tmdbId; }

    public List<rating> getRatings() { return ratings; }
    public void setRatings(List<rating> ratings) { this.ratings = ratings; }
}