package com.eventix.booking.controller;

import com.eventix.booking.dto.BookingRequest;
import com.eventix.booking.dto.BookingResponse;
import com.eventix.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody BookingRequest request,
                                                    @RequestHeader("Authorization") String authorization) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.create(request, authorization));
    }

    @GetMapping
    public ResponseEntity<List<BookingResponse>> myBookings(@RequestHeader("Authorization") String authorization) {
        return ResponseEntity.ok(bookingService.findMyBookings(authorization));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> findById(@PathVariable Long id,
                                                       @RequestHeader("Authorization") String authorization) {
        return ResponseEntity.ok(bookingService.findById(id, authorization));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancel(@PathVariable Long id,
                                                     @RequestHeader("Authorization") String authorization) {
        return ResponseEntity.ok(bookingService.cancel(id, authorization));
    }
}
