package com.careercompass;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import static org.assertj.core.api.Assertions.*;

class OwnerIdentityTest {
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    @Test void oidcIdentityUsesIssuerAndSubjectRatherThanMutableEmail() {
        var token = new OidcIdToken("test", Instant.now(), Instant.now().plusSeconds(60),
            Map.of("iss", "https://issuer.example", "sub", "stable-subject", "email", "changeable@example.com"));
        var user = new DefaultOidcUser(List.of(), token);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user, "unused", List.of()));
        assertThat(new CurrentOwner().id()).isEqualTo("https://issuer.example|stable-subject");
    }
    @Test void missingAuthenticationCannotSelectAnOwner() {
        assertThatThrownBy(() -> new CurrentOwner().id()).isInstanceOf(IllegalStateException.class);
    }
}
