package com.movieapp.recommendation.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class HomeController {

    @GetMapping("/")
    public ApiInfo home() {
        return new ApiInfo(
                "Movie Recommendation API is running",
                List.of(
                        "/api/movies",
                        "/api/genres",
                        "/api/auth/login",
                        "/api/auth/register"),
                LocalDateTime.now());
    }

    public record ApiInfo(
            String message,
            List<String> endpoints,
            LocalDateTime timestamp) {
    }
}
