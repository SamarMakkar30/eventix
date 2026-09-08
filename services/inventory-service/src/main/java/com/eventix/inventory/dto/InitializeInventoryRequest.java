package com.eventix.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InitializeInventoryRequest {

    @NotNull(message = "totalSeats is required")
    @Positive(message = "totalSeats must be positive")
    private Integer totalSeats;
}
