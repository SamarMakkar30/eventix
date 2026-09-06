package com.eventix.auth.controller;

import com.eventix.auth.dto.UserResponse;
import com.eventix.auth.model.Role;
import com.eventix.auth.repository.UserRepository;
import com.eventix.auth.security.JwtAuthFilter;
import com.eventix.auth.security.JwtService;
import com.eventix.auth.security.RestAuthenticationEntryPoint;
import com.eventix.auth.security.SecurityConfig;
import com.eventix.auth.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, RestAuthenticationEntryPoint.class})
class AuthSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @MockBean
    private AuthService authService;
    @MockBean
    private JwtService jwtService;
    @MockBean
    private UserRepository userRepository;

    @Test
    void authenticatedMeReturnsCurrentUser() throws Exception {
        when(jwtService.extractEmail("valid-token")).thenReturn("asha@example.com");
        when(jwtService.isTokenValid("valid-token", "asha@example.com")).thenReturn(true);
        when(jwtService.extractRole("valid-token")).thenReturn("CUSTOMER");
        when(authService.getCurrentUser("asha@example.com"))
                .thenReturn(new UserResponse(42L, "Asha Verma", "asha@example.com", Role.CUSTOMER));

        mockMvc.perform(get("/auth/me").header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("asha@example.com"));
    }

    @Test
    void unauthenticatedMeReturnsJsonUnauthorized() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
