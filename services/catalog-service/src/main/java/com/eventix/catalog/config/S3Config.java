package com.eventix.catalog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class S3Config {

    @Value("${aws.s3.region}")
    private String region;

    @Bean
    public S3Client s3Client() {
        // Deliberately no credentials configured here - this uses the AWS SDK's
        // default credential provider chain. On the EC2 instance (see
        // infrastructure/terraform), that automatically resolves to the IAM
        // instance profile attached there - no access keys anywhere in this
        // codebase. For local testing outside a container with real AWS access,
        // set AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY as environment variables
        // instead; everything else in Catalog Service works fine without either.
        return S3Client.builder()
                .region(Region.of(region))
                .build();
    }
}
