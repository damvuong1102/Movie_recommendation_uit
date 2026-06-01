package com.movieapp.recommendation.controller;

import com.movieapp.recommendation.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }

        return ResponseEntity.ok(ApiResponse.ok(UserResponse.from(user)));
    }

    public record UserResponse(
            Long id,
            String username,
            String email,
            String displayName,
            String avatarUrl,
            String role,
            LocalDateTime createdAt) {

        private static UserResponse from(User user) {
            return new UserResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getDisplayName(),
                    user.getAvatarUrl(),
                    user.getRole().name(),
                    user.getCreatedAt());
        }
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
