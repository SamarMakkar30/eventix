package com.eventix.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class InventoryResponse {
    private Long showId;
    private Integer totalSeats;
    private Integer availableSeats;
}
