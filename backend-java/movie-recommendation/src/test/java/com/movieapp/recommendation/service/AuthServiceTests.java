package com.movieapp.recommendation.service;

import com.movieapp.recommendation.entity.User;
import com.movieapp.recommendation.repositories.UserRepository;
import com.movieapp.recommendation.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:auth_service_tests;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.jpa.show-sql=false"
})
class AuthServiceTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Test
    void registerPersistsUserAndReturnsUsableToken() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String username = "new_user_" + suffix;
        String email = username + "@example.com";

        AuthService.AuthResult result = authService.register(username, email, "secret123", "New User");

        User savedUser = userRepository.findByUsername(username).orElseThrow();
        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getEmail()).isEqualTo(email);
        assertThat(savedUser.getDisplayName()).isEqualTo("New User");
        assertThat(savedUser.isEnabled()).isTrue();

        assertThat(result.user().id()).isEqualTo(savedUser.getId());
        assertThat(jwtService.extractUsername(result.accessToken())).isEqualTo(username);
        assertThat(jwtService.isTokenValid(result.accessToken(), savedUser)).isTrue();
    }

    @Test
    void loginExistingUserReturnsUsableTokenWithoutCreatingDuplicateUser() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String username = "login_user_" + suffix;
        String email = username + "@example.com";

        authService.register(username, email, "secret123", "Login User");
        long usersBeforeLogin = userRepository.count();

        AuthService.AuthResult result = authService.login(username, "secret123");

        User savedUser = userRepository.findByUsername(username).orElseThrow();
        assertThat(userRepository.count()).isEqualTo(usersBeforeLogin);
        assertThat(result.user().id()).isEqualTo(savedUser.getId());
        assertThat(jwtService.extractUsername(result.accessToken())).isEqualTo(username);
        assertThat(jwtService.isTokenValid(result.accessToken(), savedUser)).isTrue();
    }

    @Test
    void refreshReturnsNewUsableTokensForPersistedUser() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String username = "refresh_user_" + suffix;
        String email = username + "@example.com";

        AuthService.AuthResult registered = authService.register(username, email, "secret123", "Refresh User");

        AuthService.AuthResult refreshed = authService.refresh(registered.refreshToken());

        User savedUser = userRepository.findByUsername(username).orElseThrow();
        assertThat(refreshed.user().id()).isEqualTo(savedUser.getId());
        assertThat(jwtService.extractUsername(refreshed.accessToken())).isEqualTo(username);
        assertThat(jwtService.isTokenValid(refreshed.accessToken(), savedUser)).isTrue();
        assertThat(jwtService.isTokenValid(refreshed.refreshToken(), savedUser)).isTrue();
    }
}
