package com.careercompass;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import org.springframework.web.server.ResponseStatusException;

class DocumentValidationTest {
    @Test void recognizesPdfFromContentInsteadOfClaimedMimeType() {
        assertThat(DocumentController.validateContent("%PDF-1.7\n".getBytes(StandardCharsets.UTF_8))).isEqualTo("application/pdf");
    }
    @Test void acceptsPlainUtf8AndRejectsBinaryOrBlankData() {
        assertThat(DocumentController.validateContent("Java, AWS, résumé".getBytes(StandardCharsets.UTF_8))).isEqualTo("text/plain");
        assertThatThrownBy(() -> DocumentController.validateContent(new byte[] {0, 1, 2})).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> DocumentController.validateContent(new byte[] {(byte) 0xff})).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> DocumentController.validateContent(new byte[] {32})).isInstanceOf(ResponseStatusException.class);
    }
}
