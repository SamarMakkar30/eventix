package com.eventix.auth.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "test-secret-that-is-at-least-thirty-two-bytes-long";

    @Test
    void generatesAndValidatesHs256Token() {
        JwtService jwtService = jwtService(SECRET, 60_000);

        String token = jwtService.generateToken(42L, "asha@example.com", "CUSTOMER");

        assertThat(jwtService.extractEmail(token)).isEqualTo("asha@example.com");
        assertThat(jwtService.extractUserId(token)).isEqualTo(42L);
        assertThat(jwtService.extractRole(token)).isEqualTo("CUSTOMER");
        assertThat(jwtService.isTokenValid(token, "asha@example.com")).isTrue();
        assertThat(jwtService.isTokenValid(token, "other@example.com")).isFalse();
    }

    @Test
    void rejectsTokenSignedWithAnotherSecret() {
        String token = jwtService(SECRET, 60_000).generateToken(42L, "asha@example.com", "CUSTOMER");

        assertThatThrownBy(() -> jwtService("another-secret-that-is-also-at-least-thirty-two-bytes", 60_000)
                .extractEmail(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void rejectsExpiredToken() {
        String token = jwtService(SECRET, -1).generateToken(42L, "asha@example.com", "CUSTOMER");

        assertThatThrownBy(() -> jwtService(SECRET, 60_000).extractEmail(token))
                .isInstanceOf(JwtException.class);
    }

    private JwtService jwtService(String secret, long expirationMs) {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "secret", secret);
        ReflectionTestUtils.setField(service, "expirationMs", expirationMs);
        return service;
    }
}
