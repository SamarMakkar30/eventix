package com.eventix.booking.client;

import com.eventix.booking.exception.InsufficientInventoryException;
import com.eventix.booking.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryClient {

    private final RestTemplate restTemplate;

    @Value("${inventory.service.url}")
    private String inventoryServiceUrl;

    // NOT best-effort: if this fails, the booking must fail too - we cannot confirm
    // a booking for seats we never actually reserved.
    public void decrementSeats(Long showId, Integer quantity, String authorizationHeader) {
        try {
            post(showId, "decrement", quantity, authorizationHeader);
        } catch (HttpClientErrorException.Conflict ex) {
            throw new InsufficientInventoryException("Not enough seats available for show " + showId);
        } catch (HttpClientErrorException.NotFound ex) {
            throw new ResourceNotFoundException("No inventory record for show " + showId);
        }
    }

    // The caller chooses how to handle a release failure. Payment compensation is
    // best-effort and logs it for reconciliation; cancellation must not transition
    // a booking to CANCELLED if this operation fails.
    public void releaseSeats(Long showId, Integer quantity, String authorizationHeader) {
        post(showId, "release", quantity, authorizationHeader);
    }

    private void post(Long showId, String action, Integer quantity, String authorizationHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authorizationHeader != null) {
            headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);
        }
        Map<String, Object> body = Map.of("quantity", quantity);
        String url = inventoryServiceUrl + "/inventory/shows/" + showId + "/" + action;
        restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Void.class);
    }
}
