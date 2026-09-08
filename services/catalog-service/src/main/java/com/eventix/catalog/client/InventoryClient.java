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
// Deliberately best-effort: if this call fails, we log loudly but do NOT roll back
// the Show that Catalog Service just created. Catalog is the source of truth for
// what shows exist; a temporarily-unreachable Inventory Service becoming consistent
// again is treated as an operational/reconciliation concern, not a reason to make
// show creation itself fail. This is a real distributed-systems trade-off worth
// calling out explicitly in your report rather than hiding it.
@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryClient {

    private final RestTemplate restTemplate;

    @Value("${inventory.service.url}")
    private String inventoryServiceUrl;

    public void initializeInventory(Long showId, Integer totalSeats, String authorizationHeader) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (authorizationHeader != null) {
                headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);
            }

            Map<String, Object> body = Map.of("totalSeats", totalSeats);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            String url = inventoryServiceUrl + "/inventory/shows/" + showId + "/initialize";
            restTemplate.postForEntity(url, entity, Void.class);
            log.info("Inventory initialized for show {} with {} seats", showId, totalSeats);
        } catch (Exception ex) {
            log.error("Failed to initialize inventory for show {}: {}. This show now exists "
                    + "without an inventory record - retry manually or via a reconciliation job.",
                    showId, ex.getMessage());
        }
    }
}
