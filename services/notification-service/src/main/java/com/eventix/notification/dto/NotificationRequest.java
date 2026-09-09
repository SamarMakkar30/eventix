package com.eventix.notification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationRequest {

    @NotBlank(message = "userEmail is required")
    private String userEmail;

    private Long bookingId;

    @NotBlank(message = "subject is required")
    private String subject;

    @NotBlank(message = "message is required")
    private String message;
}
