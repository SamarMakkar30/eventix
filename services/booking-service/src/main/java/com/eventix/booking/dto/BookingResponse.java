package com.eventix.booking.dto;

import com.eventix.booking.model.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private Long showId;
    private String showTitle;
    private String venueName;
    private LocalDateTime showDateTime;
    private Integer quantity;
    private BigDecimal pricePerTicket;
    private BigDecimal totalAmount;
    private BookingStatus status;
    private Long paymentId;
    private Instant createdAt;
}
