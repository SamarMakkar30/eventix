package com.eventix.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;
    private String category;
    private String bannerUrl;
}
