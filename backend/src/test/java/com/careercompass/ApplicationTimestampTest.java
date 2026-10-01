package com.careercompass;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.validation.ValidationConfigurationCustomizer;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = ApplicationController.class, properties = {"app.username=compass", "app.password=test-password"})
@Import({SecurityConfig.class, CurrentOwner.class, ApplicationTimestampTest.ValidationClock.class})
class ApplicationTimestampTest {
    private static final Instant VALIDATION_TIME = Instant.parse("2026-10-01T01:18:06.742Z");
    private static final UUID ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockitoBean JdbcClient db;

    @TestConfiguration(proxyBeanMethods = false)
    static class ValidationClock {
        @Bean ValidationConfigurationCustomizer fixedValidationClock() {
            return configuration -> configuration.clockProvider(() -> Clock.fixed(VALIDATION_TIME, ZoneOffset.UTC));
        }
    }

    private Map<String, Object> body(String createdAt) {
        var body = new HashMap<String, Object>();
        body.put("id", ID.toString());
        body.put("company", "Example");
        body.put("role", "Engineer");
        body.put("status", "Applied");
        if (createdAt != null) body.put("createdAt", createdAt);
        return body;
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"2020-01-01T00:00:00Z", "2026-10-01T01:18:07.287Z"})
    @SuppressWarnings("unchecked")
    void savesWithServerTimeEvenWhenClientTimeIs545MillisecondsAhead(String clientTime) throws Exception {
        var statement = mock(JdbcClient.StatementSpec.class, RETURNS_SELF);
        var query = (JdbcClient.MappedQuerySpec<ApplicationRecord>) mock(JdbcClient.MappedQuerySpec.class);
        var insertedAt = new AtomicReference<Instant>();
        when(db.sql(anyString())).thenReturn(statement);
        when(statement.param(eq("createdAt"), any())).thenAnswer(invocation -> {
            insertedAt.set(((Timestamp) invocation.getArgument(1)).toInstant());
            return statement;
        });
        when(statement.query(any(RowMapper.class))).thenReturn(query);
        when(query.single()).thenAnswer(invocation -> new ApplicationRecord(ID, "Example", "Engineer",
            ApplicationRecord.Status.Applied, null, null, null, insertedAt.get()));

        var before = Instant.now();
        var result = mvc.perform(put("/api/applications/" + ID)
            .with(httpBasic("compass", "test-password")).with(csrf())
            .contentType("application/json").content(json.writeValueAsString(body(clientTime))))
            .andExpect(status().isOk()).andReturn();

        assertThat(insertedAt.get()).isBetween(before, Instant.now());
        if (clientTime != null) assertThat(insertedAt.get()).isNotEqualTo(Instant.parse(clientTime));
        assertThat(json.readTree(result.getResponse().getContentAsString()).get("createdAt").asText())
            .isEqualTo(insertedAt.get().toString());
        verify(statement).update();
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = "2026-10-01T01:18:07.287Z")
    void importsStillRequireAPastOrPresentTimestamp(String clientTime) throws Exception {
        mvc.perform(post("/api/applications/import")
            .with(httpBasic("compass", "test-password")).with(csrf())
            .contentType("application/json").content(json.writeValueAsString(Map.of("items", new Object[]{body(clientTime)}))))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(db);
    }
}
