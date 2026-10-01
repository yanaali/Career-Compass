package com.careercompass;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = ApplicationController.class, properties = "app.auth-mode=oidc")
@Import({SecurityConfig.class, CurrentOwner.class, OidcSecurityTest.Clients.class})
class OidcSecurityTest {
    @Autowired MockMvc mvc;
    @MockitoBean JdbcClient db;

    @TestConfiguration
    static class Clients {
        @Bean ClientRegistrationRepository registrations() {
            return new InMemoryClientRegistrationRepository(ClientRegistration.withRegistrationId("cognito")
                .clientId("test-client").clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}").scope("openid")
                .authorizationUri("https://issuer.example/authorize").tokenUri("https://issuer.example/token")
                .jwkSetUri("https://issuer.example/jwks").userNameAttributeName("sub").build());
        }
    }

    @Test void startsAuthorizationCodeFlowWithPkce() throws Exception {
        mvc.perform(get("/oauth2/authorization/cognito")).andExpect(status().is3xxRedirection())
            .andExpect(header().string("Location", containsString("code_challenge=")))
            .andExpect(header().string("Location", containsString("code_challenge_method=S256")));
    }

    @Test void cloudModeRejectsBasicAuthAndAcceptsOidcIdentity() throws Exception {
        mvc.perform(get("/api/applications/csrf").with(httpBasic("compass", "password")))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/applications/csrf").with(oidcLogin()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty());
    }
}
