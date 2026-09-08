package com.eventix.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EventResponse {
    private Long id;
    private String name;
    private String description;
    private String category;
    private String bannerUrl;
}
