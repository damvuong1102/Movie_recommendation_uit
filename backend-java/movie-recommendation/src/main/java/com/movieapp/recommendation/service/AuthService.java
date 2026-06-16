package com.movieapp.recommendation.service;

import com.movieapp.recommendation.entity.User;
import com.movieapp.recommendation.repositories.UserRepository;
import com.movieapp.recommendation.security.JwtService;
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

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResult register(String username, String email, String password, String displayName) {
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        if (userRepository.existsByEmailIgnoreCase(email)) {
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

        User savedUser = userRepository.saveAndFlush(user);

        return buildAuthResult(savedUser);
    }

    @Transactional(readOnly = true)
    public AuthResult login(String username, String password) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password", ex);
        }

        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid username or password"));
        return buildAuthResult(user);
    }

    @Transactional(readOnly = true)
    public AuthResult refresh(String refreshToken) {
        try {
            String username = jwtService.extractUsername(refreshToken);
            User user = userRepository.findByUsernameIgnoreCase(username)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED,
                            "Invalid refresh token"));

            if (!jwtService.isTokenValid(refreshToken, user)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
            }

            return buildAuthResult(user);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token", ex);
        }
    }

    private AuthResult buildAuthResult(User user) {
        return new AuthResult(
                jwtService.generateToken(user),
                jwtService.generateRefreshToken(user),
                jwtService.getExpirationMs() / 1000,
                UserResult.from(user));
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
