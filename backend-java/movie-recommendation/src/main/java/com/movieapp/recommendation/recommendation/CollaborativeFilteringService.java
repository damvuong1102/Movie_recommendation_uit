package com.movieapp.recommendation.recommender;

import com.movieapp.recommendation.entity.Rating;
import com.movieapp.recommendation.repositories.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollaborativeFilteringService {

    private final RatingRepository ratingRepository;

    /**
     * Hàm lấy danh sách ID phim gợi ý cho một User
     * @param targetUserId ID của người dùng cần gợi ý
     * @param topN Số lượng phim muốn gợi ý (ví dụ: 10 phim)
     * @return Danh sách các Movie ID tốt nhất
     */
    public List<Long> getRecommendations(Long targetUserId, int topN) {
        List<Rating> allRatings = ratingRepository.findAll();

        // Xây dựng ma trận User - Item: Map<UserId, Map<MovieId, RatingValue>>
        Map<Long, Map<Long, Double>> userItemMatrix = buildUserItemMatrix(allRatings);

        // Trường hợp User mới hoàn toàn hoặc chưa rate phim nào -> Trả về danh sách rỗng (Cold Start)
        if (!userItemMatrix.containsKey(targetUserId) || userItemMatrix.get(targetUserId).isEmpty()) {
            return Collections.emptyList();
        }

        //  Tính độ tương đồng Cosine giữa targetUser và tất cả các User khác
        Map<Long, Double> similarityScores = computeSimilarities(targetUserId, userItemMatrix);

        //  Dự đoán điểm số cho các bộ phim mà targetUser CHƯA TỪNG XEM
        Map<Long, Double> predictedRatings = predictRatings(targetUserId, userItemMatrix, similarityScores);

        //  Sắp xếp giảm dần theo điểm dự đoán và lấy ra Top N
        return predictedRatings.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(topN)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    //  Chuyển List phẳng từ DB thành Ma trận cấu trúc để tính toán nhanh
    private Map<Long, Map<Long, Double>> buildUserItemMatrix(List<Rating> ratings) {
        Map<Long, Map<Long, Double>> matrix = new HashMap<>();
        for (Rating r : ratings) {
            if (r.getUser() != null && r.getMovie() != null) {
                Long userId = r.getUser().getId();
                Long movieId = r.getMovie().getId();
                Double score = r.getRating();
                matrix.computeIfAbsent(userId, k -> new HashMap<>()).put(movieId, score);
            }
        }
        return matrix;
    }

    // Duyệt qua toàn bộ hàng xóm để tính điểm số tương đồng
    private Map<Long, Double> computeSimilarities(Long targetUserId, Map<Long, Map<Long, Double>> matrix) {
        Map<Long, Double> similarities = new HashMap<>();
        Map<Long, Double> targetUserRatings = matrix.get(targetUserId);

        for (Long userId : matrix.keySet()) {
            if (userId.equals(targetUserId)) continue;

            double sim = calculateCosine(targetUserRatings, matrix.get(userId));
            if (sim > 0.0) { // Chỉ giữ lại những người có sở thích tương đồng mang giá trị dương
                similarities.put(userId, sim);
            }
        }
        return similarities;
    }

    // Công thức toán học Cosine Similarity
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

        if (normA == 0.0 || normB == 0.0) return 0.0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    //  Dự đoán xem targetUser sẽ chấm mấy sao cho các phim chưa xem
    private Map<Long, Double> predictRatings(Long targetUserId, Map<Long, Map<Long, Double>> matrix, Map<Long, Double> similarities) {
        Map<Long, Double> predictedRatings = new HashMap<>();
        Map<Long, Double> targetUserRatings = matrix.get(targetUserId);

        // Tìm tất cả các phim mà targetUser CHƯA xem nhưng các hàng xóm ĐÃ xem
        Set<Long> candidateMovies = new HashSet<>();
        for (Long neighborId : similarities.keySet()) {
            candidateMovies.addAll(matrix.get(neighborId).keySet());
        }
        candidateMovies.removeAll(targetUserRatings.keySet()); // Loại bỏ những phim targetUser đã xem

        // Tính toán điểm dự đoán dựa trên trung bình có trọng số (Weighted Average)
        for (Long movieId : candidateMovies) {
            double weightedSum = 0.0;
            double similaritySum = 0.0;

            for (Map.Entry<Long, Double> entry : similarities.entrySet()) {
                Long neighborId = entry.getKey();
                double sim = entry.getValue();
                Map<Long, Double> neighborRatings = matrix.get(neighborId);

                if (neighborRatings.containsKey(movieId)) {
                    weightedSum += sim * neighborRatings.get(movieId);
                    similaritySum += sim;
                }
            }

            if (similaritySum > 0.0) {
                predictedRatings.put(movieId, weightedSum / similaritySum);
            }
        }
        return predictedRatings;
    }
}