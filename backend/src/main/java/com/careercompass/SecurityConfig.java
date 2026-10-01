package com.careercompass;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
class SecurityConfig {
    @Bean
    @ConditionalOnProperty(name = "app.auth-mode", havingValue = "basic", matchIfMissing = true)
    InMemoryUserDetailsManager users(@Value("${app.username}") String username,
                                    @Value("${app.password}") String password) {
        if (password.isBlank()) throw new IllegalStateException("APP_PASSWORD must not be blank");
        return new InMemoryUserDetailsManager(User.withUsername(username)
            .password("{bcrypt}" + new BCryptPasswordEncoder().encode(password)).roles("OWNER").build());
    }

    @Bean
    SecurityFilterChain security(HttpSecurity http, @Value("${app.auth-mode:basic}") String mode) throws Exception {
        // Keep CSRF protection for browser-cached Basic credentials. The SPA sends the token explicitly.
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                .requestMatchers("/api/auth/config", "/oauth2/**", "/login/**").permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(errors -> errors.authenticationEntryPoint((request, response, exception) -> response.sendError(401)))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .csrf(Customizer.withDefaults())
            .logout(logout -> logout.logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204)));
        if (mode.equals("oidc")) http.oauth2Login(login -> login.defaultSuccessUrl("/dashboard", true));
        else if (mode.equals("basic")) http.httpBasic(basic -> basic.authenticationEntryPoint((request, response, exception) -> response.sendError(401)));
        else throw new IllegalStateException("Unknown AUTH_MODE");
        return http.build();
    }
}
