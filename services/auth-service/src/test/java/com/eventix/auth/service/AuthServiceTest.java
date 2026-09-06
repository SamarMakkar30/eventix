package com.eventix.auth.service;

import com.eventix.auth.dto.AuthResponse;
import com.eventix.auth.dto.LoginRequest;
import com.eventix.auth.dto.RegisterRequest;
import com.eventix.auth.exception.EmailAlreadyExistsException;
import com.eventix.auth.model.User;
import com.eventix.auth.repository.UserRepository;
import com.eventix.auth.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtService jwtService;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void registerHashesPasswordAndReturnsJwt() {
        RegisterRequest request = registerRequest();
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(42L);
            return user;
        });
        when(jwtService.generateToken(anyLong(), anyString(), anyString())).thenReturn("signed-jwt");

        AuthResponse response = authService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();
        assertThat(saved.getPasswordHash()).isNotEqualTo(request.getPassword());
        assertThat(passwordEncoder.matches(request.getPassword(), saved.getPasswordHash())).isTrue();
        assertThat(response.getToken()).isEqualTo("signed-jwt");
        assertThat(response.getUser().getEmail()).isEqualTo(request.getEmail());
        assertThat(response.getUser().getRole().name()).isEqualTo("CUSTOMER");
    }

    @Test
    void registerRejectsExistingEmail() {
        RegisterRequest request = registerRequest();
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(EmailAlreadyExistsException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginAcceptsCorrectPasswordAndRejectsIncorrectPassword() {
        User user = User.builder()
                .id(42L)
                .email("asha@example.com")
                .name("Asha Verma")
                .passwordHash(passwordEncoder.encode("password123"))
                .build();
        user.setRole(com.eventix.auth.model.Role.CUSTOMER);
        when(userRepository.findByEmail("asha@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(anyLong(), anyString(), anyString())).thenReturn("signed-jwt");

        LoginRequest validLogin = new LoginRequest();
        validLogin.setEmail("asha@example.com");
        validLogin.setPassword("password123");
        assertThat(authService.login(validLogin).getToken()).isEqualTo("signed-jwt");

        LoginRequest invalidLogin = new LoginRequest();
        invalidLogin.setEmail("asha@example.com");
        invalidLogin.setPassword("not-the-password");
        assertThatThrownBy(() -> authService.login(invalidLogin))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    private RegisterRequest registerRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Asha Verma");
        request.setEmail("asha@example.com");
        request.setPassword("password123");
        return request;
    }
}
