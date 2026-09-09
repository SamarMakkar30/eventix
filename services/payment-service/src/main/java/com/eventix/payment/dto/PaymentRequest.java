package com.eventix.payment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PaymentRequest {

    @NotNull(message = "bookingId is required")
    private Long bookingId;

    @NotNull(message = "amount is required")
    @Positive(message = "amount must be positive")
    private BigDecimal amount;

    // Demo/testing aid ONLY - lets you deterministically trigger the payment-failure
    // path (and watch Booking Service's compensating inventory release happen) without
    // relying on a real payment gateway or random chance during a live demo. A real
    // payment integration would never let the client dictate success/failure like this.
    private boolean simulateFailure;
}
