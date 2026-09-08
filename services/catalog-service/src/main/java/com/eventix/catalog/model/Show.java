package com.eventix.catalog.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

// Deliberately using plain Long ids for movieId/eventId/venueId instead of JPA
// @ManyToOne relations. This keeps the service simple and avoids lazy-loading /
// serialization complications - existence is validated explicitly in ShowService.
@Entity
@Table(name = "shows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Show {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "show_type", nullable = false)
    private ShowType showType;

    @Column(name = "movie_id")
    private Long movieId;

    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "venue_id", nullable = false)
    private Long venueId;

    @Column(name = "show_date_time", nullable = false)
    private LocalDateTime showDateTime;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "total_seats", nullable = false)
    private Integer totalSeats;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
