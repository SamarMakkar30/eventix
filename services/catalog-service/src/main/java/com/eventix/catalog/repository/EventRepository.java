package com.eventix.catalog.repository;

import com.eventix.catalog.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
}
