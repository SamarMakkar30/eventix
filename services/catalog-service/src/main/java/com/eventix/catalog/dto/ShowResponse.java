package com.eventix.catalog.dto;

import com.eventix.catalog.model.ShowType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ShowResponse {
    private Long id;
    private ShowType showType;
    private Long movieId;
    private Long eventId;
    private String title;       // resolved movie title or event name, for display
    private Long venueId;
    private String venueName;   // resolved, for display
    private LocalDateTime showDateTime;
    private BigDecimal price;
    private Integer totalSeats;
}
