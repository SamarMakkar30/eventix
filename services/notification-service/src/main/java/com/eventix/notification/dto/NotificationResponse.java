package com.eventix.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String userEmail;
    private Long bookingId;
    private String subject;
    private String message;
    private Instant createdAt;
}
