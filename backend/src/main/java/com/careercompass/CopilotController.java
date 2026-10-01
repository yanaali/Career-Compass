package com.careercompass;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@RestController
class CopilotController {
    private final CurrentOwner owner;
    private final RestClient client;
    private final String token;

    CopilotController(CurrentOwner owner, @Value("${app.ai.url}") String url, @Value("${app.ai.token:}") String token) {
        this.owner = owner; this.token = token;
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(150));
        client = RestClient.builder().baseUrl(url).requestFactory(factory).build();
    }

    record Question(@NotBlank @Size(max = 4000) String question) {}

    @PostMapping("/api/copilot/chat")
    Map<?, ?> chat(@Valid @RequestBody Question question) {
        if (token.isBlank()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Copilot is not configured");
        try {
            return client.post().uri("/chat").header("Authorization", "Bearer " + token)
                .body(Map.of("owner_id", owner.id(), "question", question.question()))
                .retrieve().body(Map.class);
        } catch (RestClientException error) {
            // Never expose provider messages, document content, or secrets in API errors.
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Copilot could not complete the request");
        }
    }
}
