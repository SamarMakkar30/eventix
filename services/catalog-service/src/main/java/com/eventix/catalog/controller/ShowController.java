package com.eventix.catalog.controller;

import com.eventix.catalog.dto.ShowRequest;
import com.eventix.catalog.dto.ShowResponse;
import com.eventix.catalog.service.ShowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/catalog/shows")
@RequiredArgsConstructor
public class ShowController {

    private final ShowService showService;

    @PostMapping
    public ResponseEntity<ShowResponse> create(@Valid @RequestBody ShowRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(showService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<ShowResponse>> findAll() {
        return ResponseEntity.ok(showService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShowResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(showService.findById(id));
    }
}
