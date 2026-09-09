package com.eventix.booking.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationClient {

    private final RestTemplate restTemplate;

    @Value("${notification.service.url}")
    private String notificationServiceUrl;

    // Fire-and-forget: a failed confirmation email is annoying, not a reason to
    // undo an otherwise-successful, already-paid-for booking.
    public void sendBookingConfirmation(String userEmail, Long bookingId, String message, String authorizationHeader) {
        send(userEmail, bookingId, "Your Eventix booking is confirmed", message, authorizationHeader, "confirmation");
    }

    public void sendBookingCancellation(String userEmail, Long bookingId, String message, String authorizationHeader) {
        send(userEmail, bookingId, "Your Eventix booking has been cancelled", message, authorizationHeader, "cancellation");
    }

    private void send(String userEmail, Long bookingId, String subject, String message, String authorizationHeader,
                      String notificationType) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (authorizationHeader != null) {
                headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);
            }
            Map<String, Object> body = Map.of(
                    "userEmail", userEmail,
                    "bookingId", bookingId,
                    "subject", subject,
                    "message", message
            );
            String url = notificationServiceUrl + "/notifications";
            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Void.class);
        } catch (Exception ex) {
            log.warn("Failed to send booking {} notification for booking {}: {}", notificationType, bookingId, ex.getMessage());
        }
    }
}
