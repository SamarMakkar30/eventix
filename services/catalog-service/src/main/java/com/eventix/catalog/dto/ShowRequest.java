package com.eventix.catalog.dto;

import com.eventix.catalog.model.ShowType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class ShowRequest {

    @NotNull(message = "showType is required (MOVIE or EVENT)")
    private ShowType showType;

    // Exactly one of movieId / eventId must be provided - enforced in ShowService,
    // not here, because the rule spans two optional fields.
    private Long movieId;
    private Long eventId;

    @NotNull(message = "venueId is required")
    private Long venueId;

    @NotNull(message = "showDateTime is required")
    @Future(message = "showDateTime must be in the future")
    private LocalDateTime showDateTime;

    @NotNull(message = "price is required")
    @Positive(message = "price must be positive")
    private BigDecimal price;

    @NotNull(message = "totalSeats is required")
    @Positive(message = "totalSeats must be positive")
    private Integer totalSeats;
}
