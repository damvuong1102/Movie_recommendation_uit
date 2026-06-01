package com.movieapp.recommendation.service;

import com.movieapp.recommendation.recommendation.CollaborativeFilteringService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final CollaborativeFilteringService collaborativeFilteringService;
    private final MovieService movieService;

    public List<MovieService.MovieSummaryResult> getRecommendations(Long userId, int limit) {
        List<Long> movieIds = collaborativeFilteringService.getRecommendations(userId, limit);
        return movieService.findSummariesByIds(movieIds);
    }
}
