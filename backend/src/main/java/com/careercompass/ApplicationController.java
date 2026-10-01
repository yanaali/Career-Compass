package com.careercompass;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.groups.Default;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/applications")
class ApplicationController {
    private final JdbcClient db;
    private final CurrentOwner owner;
    ApplicationController(JdbcClient db, CurrentOwner owner) { this.db = db; this.owner = owner; }

    private static final RowMapper<ApplicationRecord> ROW = (rs, index) -> new ApplicationRecord(
        rs.getObject("id", UUID.class), rs.getString("company"), rs.getString("role"),
        ApplicationRecord.Status.valueOf(rs.getString("status")), rs.getString("link"),
        rs.getTimestamp("next_follow_up") == null ? null : rs.getTimestamp("next_follow_up").toInstant(),
        rs.getString("notes"), rs.getTimestamp("created_at").toInstant());

    @GetMapping("/csrf")
    Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }

    @GetMapping
    List<ApplicationRecord> list() {
        return db.sql("SELECT * FROM applications WHERE owner_id = :owner ORDER BY created_at DESC, id")
            .param("owner", owner.id()).query(ROW).list();
    }

    @PutMapping("/{id}")
    @Transactional
    ApplicationRecord save(@PathVariable UUID id, @Valid @RequestBody ApplicationRecord item) {
        if (!id.equals(item.id())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID mismatch");
        parameters("""
            INSERT INTO applications (owner_id, id, company, role, status, link, next_follow_up, notes, created_at)
            VALUES (:owner, :id, :company, :role, :status, :link, :followUp, :notes, :createdAt)
            ON CONFLICT (owner_id, id) DO UPDATE SET company = EXCLUDED.company, role = EXCLUDED.role,
            status = EXCLUDED.status, link = EXCLUDED.link, next_follow_up = EXCLUDED.next_follow_up,
            notes = EXCLUDED.notes
            """, item, Instant.now()).update();
        return db.sql("SELECT * FROM applications WHERE owner_id = :owner AND id = :id")
            .param("owner", owner.id()).param("id", id).query(ROW).single();
    }

    record ImportRequest(@NotNull @Size(max = 1000) List<@NotNull @Valid ApplicationRecord> items) {}

    @PostMapping("/import")
    @Transactional
    List<ApplicationRecord> importLocal(@Validated({Default.class, ApplicationRecord.ImportValidation.class}) @RequestBody ImportRequest request) {
        for (ApplicationRecord item : request.items()) {
            parameters("""
                INSERT INTO applications (owner_id, id, company, role, status, link, next_follow_up, notes, created_at)
                VALUES (:owner, :id, :company, :role, :status, :link, :followUp, :notes, :createdAt)
                ON CONFLICT DO NOTHING
                """, item, item.createdAt()).update();
        }
        return list();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void delete(@PathVariable UUID id) {
        db.sql("SELECT pg_advisory_xact_lock(hashtextextended(:owner, 0))").param("owner", owner.id()).query().singleRow();
        db.sql("DELETE FROM applications WHERE owner_id = :owner AND id = :id")
            .param("owner", owner.id()).param("id", id).update();
        db.sql("DELETE FROM copilot_chunks WHERE owner_id = :owner AND source_id = :source")
            .param("owner", owner.id()).param("source", "application:" + id).update();
    }

    private JdbcClient.StatementSpec parameters(String sql, ApplicationRecord item, Instant createdAt) {
        return db.sql(sql).param("owner", owner.id()).param("id", item.id()).param("company", item.company().trim())
            .param("role", item.role().trim()).param("status", item.status().name())
            .param("link", item.link()).param("notes", item.notes())
            .param("followUp", item.nextFollowUp() == null ? null : item.nextFollowUp().atOffset(ZoneOffset.UTC), java.sql.Types.TIMESTAMP_WITH_TIMEZONE)
            .param("createdAt", Timestamp.from(createdAt));
    }
}
