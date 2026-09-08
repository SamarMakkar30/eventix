package com.eventix.inventory.controller;

import com.eventix.inventory.dto.AdjustInventoryRequest;
import com.eventix.inventory.dto.InitializeInventoryRequest;
import com.eventix.inventory.dto.InventoryResponse;
import com.eventix.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/inventory/shows")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/{showId}/initialize")
    public ResponseEntity<InventoryResponse> initialize(@PathVariable Long showId,
                                                          @Valid @RequestBody InitializeInventoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.initialize(showId, request));
    }

    @GetMapping("/{showId}")
    public ResponseEntity<InventoryResponse> get(@PathVariable Long showId) {
        return ResponseEntity.ok(inventoryService.get(showId));
    }

    @PostMapping("/{showId}/decrement")
    public ResponseEntity<InventoryResponse> decrement(@PathVariable Long showId,
                                                         @Valid @RequestBody AdjustInventoryRequest request) {
        return ResponseEntity.ok(inventoryService.decrement(showId, request));
    }

    @PostMapping("/{showId}/release")
    public ResponseEntity<InventoryResponse> release(@PathVariable Long showId,
                                                       @Valid @RequestBody AdjustInventoryRequest request) {
        return ResponseEntity.ok(inventoryService.release(showId, request));
    }
}
