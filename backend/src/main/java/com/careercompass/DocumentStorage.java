package com.careercompass;

import java.net.URI;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import jakarta.annotation.PreDestroy;

@Component
class DocumentStorage {
    private final String bucket;
    private final S3Client client;
    private final S3Presigner presigner;

    DocumentStorage(@Value("${app.s3.bucket:}") String bucket,
                    @Value("${app.s3.region:ca-central-1}") String region,
                    @Value("${app.s3.endpoint:}") String endpoint,
                    @Value("${app.s3.public-endpoint:}") String publicEndpoint) {
        this.bucket = bucket;
        var configuration = S3Configuration.builder().pathStyleAccessEnabled(!endpoint.isBlank()).build();
        var builder = S3Client.builder().region(Region.of(region)).serviceConfiguration(configuration)
            .httpClientBuilder(UrlConnectionHttpClient.builder().connectionTimeout(Duration.ofSeconds(5)).socketTimeout(Duration.ofSeconds(30)))
            .overrideConfiguration(config -> config.apiCallTimeout(Duration.ofSeconds(40)));
        var signer = S3Presigner.builder().region(Region.of(region)).serviceConfiguration(configuration);
        if (!endpoint.isBlank()) builder.endpointOverride(URI.create(endpoint));
        if (!publicEndpoint.isBlank()) signer.endpointOverride(URI.create(publicEndpoint));
        else if (!endpoint.isBlank()) signer.endpointOverride(URI.create(endpoint));
        client = builder.build();
        presigner = signer.build();
    }

    private void enabled() {
        if (bucket.isBlank()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Document storage is not configured");
    }

    void put(String key, String contentType, byte[] data) {
        enabled();
        client.putObject(PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType)
            .serverSideEncryption(ServerSideEncryption.AES256).build(), RequestBody.fromBytes(data));
    }

    void delete(String key) {
        enabled();
        client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }

    String download(String key) {
        enabled();
        return presigner.presignGetObject(request -> request.signatureDuration(Duration.ofMinutes(5))
            .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(key)
                .responseContentDisposition("attachment").build())).url().toString();
    }

    @PreDestroy void close() { client.close(); presigner.close(); }
}
