package com.careercompass;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/documents")
class DocumentController {
    private final JdbcClient db;
    private final CurrentOwner owner;
    private final DocumentStorage storage;
    DocumentController(JdbcClient db, CurrentOwner owner, DocumentStorage storage) {
        this.db = db; this.owner = owner; this.storage = storage;
    }
    record Document(UUID id, String filename, String kind, String contentType, long sizeBytes, Instant createdAt) {}
    private static final RowMapper<Document> ROW = (rs, index) -> new Document(rs.getObject("id", UUID.class),
        rs.getString("filename"), rs.getString("kind"), rs.getString("content_type"),
        rs.getLong("size_bytes"), rs.getTimestamp("created_at").toInstant());

    @GetMapping List<Document> list() {
        return db.sql("SELECT * FROM documents WHERE owner_id = :owner ORDER BY created_at DESC")
            .param("owner", owner.id()).query(ROW).list();
    }

    @PostMapping(consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    Document upload(@RequestParam MultipartFile file, @RequestParam String kind) throws Exception {
        if (!Set.of("resume", "job", "project").contains(kind)) bad("Choose resume, job, or project");
        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024) bad("Upload a file between 1 byte and 5 MB");
        byte[] bytes = file.getBytes();
        String type = validateContent(bytes);
        String filename = file.getOriginalFilename() == null ? "document" : file.getOriginalFilename();
        filename = filename.replaceAll("[\\p{Cntrl}\\\\/]", "_");
        if (filename.length() > 200) filename = filename.substring(filename.length() - 200);
        // Serializes each owner's uploads, including the quota check.
        db.sql("SELECT pg_advisory_xact_lock(hashtextextended(:owner, 0))").param("owner", owner.id()).query().singleRow();
        if (list().size() >= 20) throw new ResponseStatusException(HttpStatus.CONFLICT, "Limit of 20 documents reached");
        UUID id = UUID.randomUUID();
        String prefix = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(owner.id().getBytes(StandardCharsets.UTF_8)));
        String key = "documents/" + prefix + "/" + id;
        storage.put(key, type, bytes);
        try {
            db.sql("""
                INSERT INTO documents (id, owner_id, filename, kind, object_key, content_type, size_bytes)
                VALUES (:id, :owner, :filename, :kind, :key, :type, :size)
                """).param("id", id).param("owner", owner.id()).param("filename", filename)
                .param("kind", kind).param("key", key).param("type", type).param("size", bytes.length).update();
        } catch (RuntimeException error) {
            try { storage.delete(key); } catch (RuntimeException cleanup) { error.addSuppressed(cleanup); }
            throw error;
        }
        return db.sql("SELECT * FROM documents WHERE owner_id = :owner AND id = :id")
            .param("owner", owner.id()).param("id", id).query(ROW).single();
    }

    static String validateContent(byte[] bytes) {
        if (bytes.length >= 5 && new String(bytes, 0, 5, StandardCharsets.US_ASCII).equals("%PDF-")) return "application/pdf";
        try {
            String text = StandardCharsets.UTF_8.newDecoder().decode(ByteBuffer.wrap(bytes)).toString();
            if (text.isBlank() || text.chars().anyMatch(c -> c == 0 || (c < 32 && c != 9 && c != 10 && c != 13)))
                bad("Only PDF or UTF-8 text files are supported");
            return "text/plain";
        } catch (CharacterCodingException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PDF or UTF-8 text files are supported");
        }
    }

    @GetMapping("/{id}/download") Map<String, String> download(@PathVariable UUID id) {
        return Map.of("url", storage.download(key(id)));
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    void delete(@PathVariable UUID id) {
        db.sql("SELECT pg_advisory_xact_lock(hashtextextended(:owner, 0))").param("owner", owner.id()).query().singleRow();
        storage.delete(key(id));
        db.sql("DELETE FROM documents WHERE owner_id = :owner AND id = :id").param("owner", owner.id()).param("id", id).update();
        db.sql("DELETE FROM copilot_chunks WHERE owner_id = :owner AND source_id = :source")
            .param("owner", owner.id()).param("source", "document:" + id).update();
    }

    private String key(UUID id) {
        return db.sql("SELECT object_key FROM documents WHERE owner_id = :owner AND id = :id")
            .param("owner", owner.id()).param("id", id).query(String.class).optional()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
    private static void bad(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
