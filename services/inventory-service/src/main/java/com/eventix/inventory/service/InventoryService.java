package com.eventix.inventory.service;

import com.eventix.inventory.dto.AdjustInventoryRequest;
import com.eventix.inventory.dto.InitializeInventoryRequest;
import com.eventix.inventory.dto.InventoryResponse;
import com.eventix.inventory.exception.InsufficientInventoryException;
import com.eventix.inventory.exception.InventoryAlreadyInitializedException;
import com.eventix.inventory.exception.ResourceNotFoundException;
import com.eventix.inventory.model.Inventory;
import com.eventix.inventory.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    @Transactional
    public InventoryResponse initialize(Long showId, InitializeInventoryRequest request) {
        if (inventoryRepository.existsByShowId(showId)) {
            throw new InventoryAlreadyInitializedException("Inventory already initialized for show " + showId);
        }

        Inventory inventory = Inventory.builder()
                .showId(showId)
                .totalSeats(request.getTotalSeats())
                .availableSeats(request.getTotalSeats())
                .build();

        return toResponse(inventoryRepository.save(inventory));
    }

    public InventoryResponse get(Long showId) {
        return toResponse(getOrThrow(showId));
    }

    @Transactional
    public InventoryResponse decrement(Long showId, AdjustInventoryRequest request) {
        getOrThrow(showId); // 404 if this show has no inventory record at all
        int updated = inventoryRepository.decrementSeats(showId, request.getQuantity());
        if (updated == 0) {
            throw new InsufficientInventoryException(
                    "Not enough seats available for show " + showId + " (requested " + request.getQuantity() + ")");
        }
        return toResponse(getOrThrow(showId));
    }

    @Transactional
    public InventoryResponse release(Long showId, AdjustInventoryRequest request) {
        getOrThrow(showId);
        int updated = inventoryRepository.releaseSeats(showId, request.getQuantity());
        if (updated == 0) {
            throw new InsufficientInventoryException(
                    "Cannot release " + request.getQuantity() + " seats for show " + showId + " - would exceed total capacity");
        }
        return toResponse(getOrThrow(showId));
    }

    private Inventory getOrThrow(Long showId) {
        return inventoryRepository.findByShowId(showId)
                .orElseThrow(() -> new ResourceNotFoundException("No inventory record for show " + showId));
    }

    private InventoryResponse toResponse(Inventory i) {
        return new InventoryResponse(i.getShowId(), i.getTotalSeats(), i.getAvailableSeats());
    }
}
