package com.eventix.booking.client;

import com.eventix.booking.dto.client.ShowInfo;
import com.eventix.booking.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class CatalogClient {

    private final RestTemplate restTemplate;

    @Value("${catalog.service.url}")
    private String catalogServiceUrl;

    public ShowInfo getShow(Long showId, String authorizationHeader) {
        try {
            HttpHeaders headers = new HttpHeaders();
            if (authorizationHeader != null) {
                headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);
            }
            String url = catalogServiceUrl + "/catalog/shows/" + showId;
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), ShowInfo.class).getBody();
        } catch (HttpClientErrorException.NotFound ex) {
            throw new ResourceNotFoundException("Show " + showId + " not found");
        }
    }
}
