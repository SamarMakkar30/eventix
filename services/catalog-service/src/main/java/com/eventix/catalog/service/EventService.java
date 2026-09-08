package com.eventix.catalog.service;

import com.eventix.catalog.dto.EventRequest;
import com.eventix.catalog.dto.EventResponse;
import com.eventix.catalog.exception.ResourceNotFoundException;
import com.eventix.catalog.model.Event;
import com.eventix.catalog.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    public EventResponse create(EventRequest request) {
        Event event = Event.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .bannerUrl(request.getBannerUrl())
                .build();
        return toResponse(eventRepository.save(event));
    }

    public List<EventResponse> findAll() {
        return eventRepository.findAll().stream().map(this::toResponse).toList();
    }

    public EventResponse findById(Long id) {
        return toResponse(getOrThrow(id));
    }

    public EventResponse update(Long id, EventRequest request) {
        Event event = getOrThrow(id);
        event.setName(request.getName());
        event.setDescription(request.getDescription());
        event.setCategory(request.getCategory());
        event.setBannerUrl(request.getBannerUrl());
        return toResponse(eventRepository.save(event));
    }

    public void delete(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new ResourceNotFoundException("Event " + id + " not found");
        }
        eventRepository.deleteById(id);
    }

    Event getOrThrow(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event " + id + " not found"));
    }

    private EventResponse toResponse(Event e) {
        return new EventResponse(e.getId(), e.getName(), e.getDescription(), e.getCategory(), e.getBannerUrl());
    }
}
