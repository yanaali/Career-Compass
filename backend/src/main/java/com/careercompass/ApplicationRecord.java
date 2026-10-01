package com.careercompass;

import java.time.Instant;
import java.util.UUID;
import jakarta.validation.constraints.*;

public record ApplicationRecord(
    @NotNull UUID id,
    @NotBlank @Size(max = 200) String company,
    @NotBlank @Size(max = 200) String role,
    @NotNull Status status,
    @Size(max = 2048) @Pattern(regexp = "(?i)^https?://[^\\s]+$", message = "must be an http or https URL") String link,
    Instant nextFollowUp,
    @Size(max = 20000) String notes,
    @NotNull(groups = ImportValidation.class) @PastOrPresent(groups = ImportValidation.class) Instant createdAt
) {
    // Only imports accept a client creation time; normal saves assign it on the server.
    public interface ImportValidation {}
    public enum Status { Interested, Applied, Interview, Offer, Rejected }
}
