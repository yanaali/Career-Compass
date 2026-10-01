package com.careercompass;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = ApplicationController.class, properties = {"app.username=compass", "app.password=test-password"})
@Import({SecurityConfig.class, CurrentOwner.class})
class ApplicationSecurityTest {
    @Autowired MockMvc mvc;
    @MockitoBean JdbcClient db;

    @Test void requiresAuthentication() throws Exception {
        mvc.perform(get("/api/applications")).andExpect(status().isUnauthorized());
        verifyNoInteractions(db);
    }

    @Test void rejectsWrongPassword() throws Exception {
        mvc.perform(get("/api/applications/csrf").with(httpBasic("compass", "wrong")))
            .andExpect(status().isUnauthorized());
    }

    @Test void issuesCsrfTokenAfterSignIn() throws Exception {
        mvc.perform(get("/api/applications/csrf").with(httpBasic("compass", "test-password")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test void rejectsWritesWithoutCsrfToken() throws Exception {
        mvc.perform(delete("/api/applications/00000000-0000-0000-0000-000000000001")
            .with(httpBasic("compass", "test-password"))).andExpect(status().isForbidden());
        verifyNoInteractions(db);
    }

    @Test void rejectsInvalidImportsBeforeAnyWrite() throws Exception {
        mvc.perform(post("/api/applications/import").with(httpBasic("compass", "test-password"))
            .with(csrf()).contentType("application/json").content("""
                {"items":[{"id":"00000000-0000-0000-0000-000000000001","company":"",
                "role":"Engineer","status":"Applied","createdAt":"2020-01-01T00:00:00Z"}]}
                """)).andExpect(status().isBadRequest());
        verifyNoInteractions(db);
    }

    @Test void rejectsUnsafeLinks() throws Exception {
        mvc.perform(put("/api/applications/00000000-0000-0000-0000-000000000001")
            .with(httpBasic("compass", "test-password")).with(csrf())
            .contentType("application/json").content("""
                {"id":"00000000-0000-0000-0000-000000000001","company":"Example",
                "role":"Engineer","status":"Applied","link":"javascript:alert(1)","createdAt":"2020-01-01T00:00:00Z"}
                """)).andExpect(status().isBadRequest());
        verifyNoInteractions(db);
    }
}
