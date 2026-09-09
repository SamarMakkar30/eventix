package com.eventix.booking.dto.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class PaymentResult {
    private Long id;
    private String status; // "SUCCESS" or "FAILED"
}
