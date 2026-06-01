package com.movieapp.recommendation.recommendation;

import com.movieapp.recommendation.entity.Rating;
import com.movieapp.recommendation.repositories.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollaborativeFilteringService {

    private final RatingRepository ratingRepository;

    @Transactional(readOnly = true)
    public List<Long> getRecommendations(Long targetUserId, int topN) {
        if (targetUserId == null || topN <= 0) {
            return Collections.emptyList();
        }

        List<Rating> allRatings = ratingRepository.findAllWithUserAndMovie();
        Map<Long, Map<Long, Double>> userItemMatrix = buildUserItemMatrix(allRatings);

        if (!userItemMatrix.containsKey(targetUserId) || userItemMatrix.get(targetUserId).isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Double> similarityScores = computeSimilarities(targetUserId, userItemMatrix);
        Map<Long, Double> predictedRatings = predictRatings(targetUserId, userItemMatrix, similarityScores);

        return predictedRatings.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(topN)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private Map<Long, Map<Long, Double>> buildUserItemMatrix(List<Rating> ratings) {
        Map<Long, Map<Long, Double>> matrix = new HashMap<>();
        for (Rating rating : ratings) {
            if (rating.getUser() == null || rating.getMovie() == null || rating.getRating() == null) {
                continue;
            }

            Long userId = rating.getUser().getId();
            Long movieId = rating.getMovie().getId();
            if (userId == null || movieId == null) {
                continue;
            }

            matrix.computeIfAbsent(userId, key -> new HashMap<>()).put(movieId, rating.getRating());
        }
        return matrix;
    }

    private Map<Long, Double> computeSimilarities(Long targetUserId, Map<Long, Map<Long, Double>> matrix) {
        Map<Long, Double> similarities = new HashMap<>();
        Map<Long, Double> targetUserRatings = matrix.get(targetUserId);

        for (Long userId : matrix.keySet()) {
            if (userId.equals(targetUserId)) {
                continue;
            }

            double similarity = calculateCosine(targetUserRatings, matrix.get(userId));
            if (similarity > 0.0) {
                similarities.put(userId, similarity);
            }
        }
        return similarities;
    }

    private double calculateCosine(Map<Long, Double> user1, Map<Long, Double> user2) {
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (Map.Entry<Long, Double> entry : user1.entrySet()) {
            Long movieId = entry.getKey();
            double r1 = entry.getValue();
            if (user2.containsKey(movieId)) {
                double r2 = user2.get(movieId);
                dotProduct += r1 * r2;
            }
            normA += Math.pow(r1, 2);
        }

        for (double r2 : user2.values()) {
            normB += Math.pow(r2, 2);
        }

        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private Map<Long, Double> predictRatings(
            Long targetUserId,
            Map<Long, Map<Long, Double>> matrix,
            Map<Long, Double> similarities) {

        Map<Long, Double> predictedRatings = new HashMap<>();
        Map<Long, Double> targetUserRatings = matrix.get(targetUserId);

        Set<Long> candidateMovies = new HashSet<>();
        for (Long neighborId : similarities.keySet()) {
            candidateMovies.addAll(matrix.get(neighborId).keySet());
        }
        candidateMovies.removeAll(targetUserRatings.keySet());

        for (Long movieId : candidateMovies) {
            double weightedSum = 0.0;
            double similaritySum = 0.0;

            for (Map.Entry<Long, Double> entry : similarities.entrySet()) {
                Long neighborId = entry.getKey();
                double similarity = entry.getValue();
                Map<Long, Double> neighborRatings = matrix.get(neighborId);

                if (neighborRatings.containsKey(movieId)) {
                    weightedSum += similarity * neighborRatings.get(movieId);
                    similaritySum += similarity;
                }
            }

            if (similaritySum > 0.0) {
                predictedRatings.put(movieId, weightedSum / similaritySum);
            }
        }
        return predictedRatings;
    }
}
