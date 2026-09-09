package com.eventix.notification.service;

import com.eventix.notification.dto.NotificationRequest;
import com.eventix.notification.dto.NotificationResponse;
import com.eventix.notification.exception.ResourceNotFoundException;
import com.eventix.notification.model.Notification;
import com.eventix.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationResponse send(NotificationRequest request) {
        // "Sending" is simulated - logged loudly and persisted, not actually emailed.
        // Swap this method's body for a real provider (SES, SendGrid, etc.) later
        // without touching anything upstream, since callers only see this DTO contract.
        log.info("Notification sent: to={} subject=\"{}\" message=\"{}\"",
                request.getUserEmail(), request.getSubject(), request.getMessage());

        Notification notification = Notification.builder()
                .userEmail(request.getUserEmail())
                .bookingId(request.getBookingId())
                .subject(request.getSubject())
                .message(request.getMessage())
                .build();

        return toResponse(notificationRepository.save(notification));
    }

    public NotificationResponse findById(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification " + id + " not found"));
        return toResponse(notification);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getUserEmail(), n.getBookingId(),
                n.getSubject(), n.getMessage(), n.getCreatedAt());
    }
}
