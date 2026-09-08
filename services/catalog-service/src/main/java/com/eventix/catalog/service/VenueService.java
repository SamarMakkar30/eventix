package com.eventix.catalog.service;

import com.eventix.catalog.dto.VenueRequest;
import com.eventix.catalog.dto.VenueResponse;
import com.eventix.catalog.exception.ResourceNotFoundException;
import com.eventix.catalog.model.Venue;
import com.eventix.catalog.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VenueService {

    private final VenueRepository venueRepository;

    public VenueResponse create(VenueRequest request) {
        Venue venue = Venue.builder()
                .name(request.getName())
                .address(request.getAddress())
                .city(request.getCity())
                .build();
        return toResponse(venueRepository.save(venue));
    }

    public List<VenueResponse> findAll() {
        return venueRepository.findAll().stream().map(this::toResponse).toList();
    }

    public VenueResponse findById(Long id) {
        return toResponse(getOrThrow(id));
    }

    Venue getOrThrow(Long id) {
        return venueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venue " + id + " not found"));
    }

    private VenueResponse toResponse(Venue v) {
        return new VenueResponse(v.getId(), v.getName(), v.getAddress(), v.getCity());
    }
}
