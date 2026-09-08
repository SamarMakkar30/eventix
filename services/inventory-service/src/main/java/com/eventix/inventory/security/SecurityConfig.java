package com.eventix.inventory.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                // Anyone can check how many seats are left on a show.
                .requestMatchers(HttpMethod.GET, "/inventory/**").permitAll()
                // Only Catalog Service (acting as an admin) creates the inventory record for a new show.
                .requestMatchers(HttpMethod.POST, "/inventory/shows/*/initialize").hasRole("ADMIN")
                // Any logged-in user can trigger a decrement/release - this is what
                // Booking Service will call on a customer's behalf when they book/cancel.
                .requestMatchers(HttpMethod.POST, "/inventory/shows/*/decrement").authenticated()
                .requestMatchers(HttpMethod.POST, "/inventory/shows/*/release").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
