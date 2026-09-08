package com.eventix.inventory.repository;

import com.eventix.inventory.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByShowId(Long showId);

    boolean existsByShowId(Long showId);

    // Atomic, conditional decrement: the WHERE clause itself enforces "don't oversell".
    // If two requests race for the last seat, only one UPDATE can match the condition -
    // the database resolves the race, not application code. Returns rows affected (0 or 1).
    @Modifying
    @Query("UPDATE Inventory i SET i.availableSeats = i.availableSeats - :qty, i.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE i.showId = :showId AND i.availableSeats >= :qty")
    int decrementSeats(@Param("showId") Long showId, @Param("qty") Integer qty);

    // Symmetric atomic release (booking cancellation), capped so it can never exceed totalSeats.
    @Modifying
    @Query("UPDATE Inventory i SET i.availableSeats = i.availableSeats + :qty, i.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE i.showId = :showId AND (i.availableSeats + :qty) <= i.totalSeats")
    int releaseSeats(@Param("showId") Long showId, @Param("qty") Integer qty);
}
