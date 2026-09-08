package com.eventix.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class VenueResponse {
    private Long id;
    private String name;
    private String address;
    private String city;
}
