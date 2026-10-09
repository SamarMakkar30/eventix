package com.eventix.catalog.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

// Talks to Inventory Service to set up ticket stock the moment a Show is created.
// A show without inventory cannot be booked, so initialization failure is returned
// to the caller instead of publishing a partially usable show.
@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryClient {

    private final RestTemplate restTemplate;

    @Value("${inventory.service.url}")
    private String inventoryServiceUrl;

    @Value("${internal.service-key}")
    private String internalServiceKey;

    public void initializeInventory(Long showId, Integer totalSeats, String authorizationHeader) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Service-Key", internalServiceKey);
            if (authorizationHeader != null) {
                headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);
            }

            Map<String, Object> body = Map.of("totalSeats", totalSeats);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            String url = inventoryServiceUrl + "/inventory/shows/" + showId + "/initialize";
            restTemplate.postForEntity(url, entity, Void.class);
            log.info("Inventory initialized for show {} with {} seats", showId, totalSeats);
        } catch (RuntimeException ex) {
            log.error("Failed to initialize inventory for show {}", showId, ex);
            throw ex;
        }
    }
}
