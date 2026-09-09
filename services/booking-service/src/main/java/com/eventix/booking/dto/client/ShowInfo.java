package com.eventix.booking.dto.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Mirrors only the fields Booking Service actually needs from Catalog Service's
// ShowResponse. @JsonIgnoreProperties makes this resilient to Catalog adding more
// fields later without breaking this client.
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ShowInfo {
    private Long id;
    private String title;
    private String venueName;
    private LocalDateTime showDateTime;
    private BigDecimal price;
}
