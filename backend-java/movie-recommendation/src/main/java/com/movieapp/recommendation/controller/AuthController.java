package com.movieapp.recommendation.controller;

import com.movieapp.recommendation.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthService.AuthResult result = authService.register(
                request.username(),
                request.email(),
                request.password(),
                request.displayName());

        return ResponseEntity.ok(AuthResponse.from(result));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthService.AuthResult result = authService.login(request.username(), request.password());
        return ResponseEntity.ok(AuthResponse.from(result));
    }

    public record LoginRequest(
            @NotBlank(message = "Username is required")
            String username,

            @NotBlank(message = "Password is required")
            String password) {
    }

    public record RegisterRequest(
            @NotBlank(message = "Username is required")
            @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
            String username,

            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
            String password,

            @Size(max = 100, message = "Display name must be at most 100 characters")
            String displayName) {
    }

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            long expiresIn,
            UserResponse user) {

        private static AuthResponse from(AuthService.AuthResult result) {
            return new AuthResponse(
                    result.accessToken(),
                    result.refreshToken(),
                    "Bearer",
                    result.expiresIn(),
                    UserResponse.from(result.user()));
        }
    }

    public record UserResponse(
            Long id,
            String username,
            String email,
            String displayName,
            String avatarUrl,
            String role,
            LocalDateTime createdAt) {

        private static UserResponse from(AuthService.UserResult user) {
            return new UserResponse(
                    user.id(),
                    user.username(),
                    user.email(),
                    user.displayName(),
                    user.avatarUrl(),
                    user.role(),
                    user.createdAt());
        }
    }
}
