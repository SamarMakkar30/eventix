package com.eventix.booking.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "show_id", nullable = false)
    private Long showId;

    // Denormalized snapshot of show details at booking time - so a booking's history
    // still reads correctly even if the show is later edited or removed from Catalog.
    @Column(name = "show_title")
    private String showTitle;

    @Column(name = "venue_name")
    private String venueName;

    @Column(name = "show_date_time")
    private LocalDateTime showDateTime;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "price_per_ticket", nullable = false)
    private BigDecimal pricePerTicket;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
