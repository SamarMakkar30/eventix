package com.eventix.catalog.service;

import com.eventix.catalog.client.InventoryClient;
import com.eventix.catalog.dto.ShowRequest;
import com.eventix.catalog.dto.ShowResponse;
import com.eventix.catalog.exception.InvalidShowException;
import com.eventix.catalog.exception.ResourceNotFoundException;
import com.eventix.catalog.model.Event;
import com.eventix.catalog.model.Movie;
import com.eventix.catalog.model.Show;
import com.eventix.catalog.model.ShowType;
import com.eventix.catalog.model.Venue;
import com.eventix.catalog.repository.ShowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowService {

    private final ShowRepository showRepository;
    // Reusing the other services' getOrThrow(id) helpers (package-private) rather
    // than duplicating repository lookups here.
    private final MovieService movieService;
    private final EventService eventService;
    private final VenueService venueService;
    private final InventoryClient inventoryClient;

    public ShowResponse create(ShowRequest request, String authorizationHeader) {
        validateExactlyOneTarget(request);

        String title;
        if (request.getShowType() == ShowType.MOVIE) {
            Movie movie = movieService.getOrThrow(request.getMovieId());
            title = movie.getTitle();
        } else {
            Event event = eventService.getOrThrow(request.getEventId());
            title = event.getName();
        }

        Venue venue = venueService.getOrThrow(request.getVenueId());

        Show show = Show.builder()
                .showType(request.getShowType())
                .movieId(request.getMovieId())
                .eventId(request.getEventId())
                .thumbnailUrl(request.getThumbnailUrl())
                .venueId(request.getVenueId())
                .showDateTime(request.getShowDateTime())
                .price(request.getPrice())
                .totalSeats(request.getTotalSeats())
                .build();

        Show saved = showRepository.save(show);

        try {
            inventoryClient.initializeInventory(saved.getId(), saved.getTotalSeats(), authorizationHeader);
        } catch (RuntimeException ex) {
            showRepository.delete(saved);
            throw ex;
        }

        return toResponse(saved, title, venue.getName());
    }

    public List<ShowResponse> findAll() {
        return showRepository.findAll().stream().map(this::enrich).toList();
    }

    public ShowResponse findById(Long id) {
        Show show = getOrThrow(id);
        return enrich(show);
    }

    public ShowResponse update(Long id, ShowRequest request) {
        validateExactlyOneTarget(request);
        Show show = getOrThrow(id);
        String title = request.getShowType() == ShowType.MOVIE
                ? movieService.getOrThrow(request.getMovieId()).getTitle()
                : eventService.getOrThrow(request.getEventId()).getName();
        Venue venue = venueService.getOrThrow(request.getVenueId());

        show.setShowType(request.getShowType());
        show.setMovieId(request.getMovieId());
        show.setEventId(request.getEventId());
        show.setThumbnailUrl(request.getThumbnailUrl());
        show.setVenueId(request.getVenueId());
        show.setShowDateTime(request.getShowDateTime());
        show.setPrice(request.getPrice());
        show.setTotalSeats(request.getTotalSeats());
        return toResponse(showRepository.save(show), title, venue.getName());
    }

    Show getOrThrow(Long id) {
        return showRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Show " + id + " not found"));
    }

    public void delete(Long id) {
        if (!showRepository.existsById(id)) {
            throw new ResourceNotFoundException("Show " + id + " not found");
        }
        showRepository.deleteById(id);
    }

    private void validateExactlyOneTarget(ShowRequest request) {
        boolean hasMovie = request.getMovieId() != null;
        boolean hasEvent = request.getEventId() != null;

        if (hasMovie == hasEvent) { // both true or both false
            throw new InvalidShowException("A show must reference exactly one of movieId or eventId");
        }
        if (request.getShowType() == ShowType.MOVIE && !hasMovie) {
            throw new InvalidShowException("showType is MOVIE but movieId was not provided");
        }
        if (request.getShowType() == ShowType.EVENT && !hasEvent) {
            throw new InvalidShowException("showType is EVENT but eventId was not provided");
        }
    }

    private ShowResponse enrich(Show show) {
        String title = show.getShowType() == ShowType.MOVIE
                ? movieService.getOrThrow(show.getMovieId()).getTitle()
                : eventService.getOrThrow(show.getEventId()).getName();
        Venue venue = venueService.getOrThrow(show.getVenueId());
        return toResponse(show, title, venue.getName());
    }

    private ShowResponse toResponse(Show s, String title, String venueName) {
        return new ShowResponse(s.getId(), s.getShowType(), s.getMovieId(), s.getEventId(), s.getThumbnailUrl(),
                title, s.getVenueId(), venueName, s.getShowDateTime(), s.getPrice(), s.getTotalSeats());
    }
}
