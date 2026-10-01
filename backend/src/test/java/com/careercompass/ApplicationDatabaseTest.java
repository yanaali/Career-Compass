package com.careercompass;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(properties = {"app.username=compass", "app.password=test-password", "spring.datasource.password=unused"})
@Testcontainers(disabledWithoutDocker = true)
@WithMockUser(username = "compass")
class ApplicationDatabaseTest {
    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("pgvector/pgvector:pg16").asCompatibleSubstituteFor("postgres"));
    @Autowired ApplicationController controller;
    @Autowired JdbcClient db;
    @Autowired DocumentController documents;
    @MockitoBean DocumentStorage storage;

    @BeforeEach void clear() {
        db.sql("DELETE FROM copilot_chunks").update();
        db.sql("DELETE FROM documents").update();
        db.sql("DELETE FROM applications").update();
    }

    private ApplicationRecord item(UUID id, ApplicationRecord.Status status) {
        return new ApplicationRecord(id, "Example", "Engineer", status, "https://example.com/job",
            Instant.parse("2027-01-01T00:00:00Z"), "Java and AWS", Instant.parse("2020-01-01T00:00:00Z"));
    }

    @Test void persistsUpdatesAndDeletes() {
        var id = UUID.randomUUID();
        var before = Instant.now().minusMillis(1);
        var saved = controller.save(id, item(id, ApplicationRecord.Status.Applied));
        assertThat(saved.createdAt()).isBetween(before, Instant.now().plusMillis(1));
        assertThat(saved).usingRecursiveComparison().ignoringFields("createdAt")
            .isEqualTo(item(id, ApplicationRecord.Status.Applied));
        assertThat(controller.list()).containsExactly(saved);
        var update = new ApplicationRecord(id, "Example", "Engineer", ApplicationRecord.Status.Interview,
            "https://example.com/job", saved.nextFollowUp(), "Updated notes", Instant.parse("2099-01-01T00:00:00Z"));
        var updated = controller.save(id, update);
        assertThat(updated.createdAt()).isEqualTo(saved.createdAt());
        assertThat(updated.status()).isEqualTo(ApplicationRecord.Status.Interview);
        assertThat(updated.notes()).isEqualTo("Updated notes");
        assertThat(controller.list()).containsExactly(updated);
        controller.delete(id);
        assertThat(controller.list()).isEmpty();
    }

    @Test void createsWithoutAClientTimestamp() {
        var id = UUID.randomUUID();
        var before = Instant.now().minusMillis(1);
        var saved = controller.save(id, new ApplicationRecord(id, "Example", "Engineer",
            ApplicationRecord.Status.Applied, null, null, null, null));
        assertThat(saved.createdAt()).isBetween(before, Instant.now().plusMillis(1));
        assertThat(controller.list()).containsExactly(saved);
    }

    @Test void repeatedImportDoesNotOverwriteServerChanges() {
        var id = UUID.randomUUID();
        var imported = new ApplicationController.ImportRequest(List.of(item(id, ApplicationRecord.Status.Applied)));
        controller.importLocal(imported);
        controller.save(id, item(id, ApplicationRecord.Status.Interview));
        controller.importLocal(imported);
        assertThat(controller.list()).containsExactly(item(id, ApplicationRecord.Status.Interview));
    }

    @Test void databaseErrorRollsBackEntireImport() {
        var good = item(UUID.randomUUID(), ApplicationRecord.Status.Applied);
        var invalid = new ApplicationRecord(UUID.randomUUID(), null, "Engineer", ApplicationRecord.Status.Applied,
            null, null, null, Instant.parse("2020-01-01T00:00:00Z"));
        assertThatThrownBy(() -> controller.importLocal(new ApplicationController.ImportRequest(List.of(good, invalid))))
            .isInstanceOf(RuntimeException.class);
        assertThat(controller.list()).isEmpty();
    }

    @Test void ownersCannotReadUpdateOrDeleteEachOthersApplications() {
        var id = UUID.randomUUID();
        var saved = controller.save(id, item(id, ApplicationRecord.Status.Applied));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("other", "unused", List.of()));
        assertThat(controller.list()).isEmpty();
        controller.delete(id);
        controller.save(id, item(id, ApplicationRecord.Status.Offer));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("compass", "unused", List.of()));
        assertThat(controller.list()).containsExactly(saved);
    }

    @Test void documentOwnershipIsCheckedBeforeAccessingS3() throws Exception {
        var upload = new MockMultipartFile("file", "resume.txt", "text/plain", "Java and AWS".getBytes());
        var document = documents.upload(upload, "resume");
        org.mockito.Mockito.verify(storage).put(org.mockito.ArgumentMatchers.startsWith("documents/"),
            org.mockito.ArgumentMatchers.eq("text/plain"), org.mockito.ArgumentMatchers.any());
        org.mockito.Mockito.clearInvocations(storage);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("other", "unused", List.of()));
        assertThat(documents.list()).isEmpty();
        assertThatThrownBy(() -> documents.download(document.id())).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> documents.delete(document.id())).isInstanceOf(ResponseStatusException.class);
        org.mockito.Mockito.verifyNoInteractions(storage);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("compass", "unused", List.of()));
        assertThat(documents.list()).hasSize(1);
        documents.delete(document.id());
        assertThat(documents.list()).isEmpty();
    }
}
