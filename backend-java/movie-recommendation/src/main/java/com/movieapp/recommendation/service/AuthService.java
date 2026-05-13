package com.movieapp.recommendation.service;

import com.movieapp.recommendation.entity.User;
import com.movieapp.recommendation.security.JwtService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final EntityManager entityManager;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResult register(String username, String email, String password, String displayName) {
        if (existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        if (existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .displayName(displayName)
                .role(User.Role.USER)
                .active(true)
                .build();

        entityManager.persist(user);
        entityManager.flush();

        return buildAuthResult(user);
    }

    @Transactional(readOnly = true)
    public AuthResult login(String username, String password) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password", ex);
        }

        User user = findByUsername(username);
        return buildAuthResult(user);
    }

    private AuthResult buildAuthResult(User user) {
        return new AuthResult(
                jwtService.generateToken(user),
                jwtService.generateRefreshToken(user),
                jwtService.getExpirationMs() / 1000,
                UserResult.from(user));
    }

    private boolean existsByUsername(String username) {
        Long count = entityManager.createQuery(
                        "SELECT COUNT(u) FROM User u WHERE LOWER(u.username) = LOWER(:username)",
                        Long.class)
                .setParameter("username", username)
                .getSingleResult();

        return count > 0;
    }

    private boolean existsByEmail(String email) {
        Long count = entityManager.createQuery(
                        "SELECT COUNT(u) FROM User u WHERE LOWER(u.email) = LOWER(:email)",
                        Long.class)
                .setParameter("email", email)
                .getSingleResult();

        return count > 0;
    }

    private User findByUsername(String username) {
        try {
            return entityManager.createQuery(
                            "SELECT u FROM User u WHERE u.username = :username",
                            User.class)
                    .setParameter("username", username)
                    .getSingleResult();
        } catch (NoResultException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password", ex);
        }
    }

    public record AuthResult(
            String accessToken,
            String refreshToken,
            long expiresIn,
            UserResult user) {
    }

    public record UserResult(
            Long id,
            String username,
            String email,
            String displayName,
            String avatarUrl,
            String role,
            LocalDateTime createdAt) {

        private static UserResult from(User user) {
            return new UserResult(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getDisplayName(),
                    user.getAvatarUrl(),
                    user.getRole().name(),
                    user.getCreatedAt());
        }
    }
}
