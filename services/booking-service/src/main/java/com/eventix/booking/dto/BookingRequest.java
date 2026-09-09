package com.eventix.booking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookingRequest {

    @NotNull(message = "showId is required")
    private Long showId;

    @NotNull(message = "quantity is required")
    @Positive(message = "quantity must be positive")
    private Integer quantity;

    // Demo/testing aid - forwarded to Payment Service's simulateFailure flag so you
    // can deterministically trigger the compensating-transaction path in a live demo.
    // See PaymentRequest.simulateFailure in payment-service for the full rationale.
    private boolean simulatePaymentFailure;
}
