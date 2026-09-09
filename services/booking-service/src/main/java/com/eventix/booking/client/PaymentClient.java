package com.eventix.booking.client;

import com.eventix.booking.dto.client.PaymentResult;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PaymentClient {

    private final RestTemplate restTemplate;

    @Value("${payment.service.url}")
    private String paymentServiceUrl;

    public PaymentResult charge(Long bookingId, BigDecimal amount, boolean simulateFailure, String authorizationHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authorizationHeader != null) {
            headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);
        }
        Map<String, Object> body = Map.of(
                "bookingId", bookingId,
                "amount", amount,
                "simulateFailure", simulateFailure
        );
        String url = paymentServiceUrl + "/payments";
        return restTemplate.postForObject(url, new HttpEntity<>(body, headers), PaymentResult.class);
    }
}
