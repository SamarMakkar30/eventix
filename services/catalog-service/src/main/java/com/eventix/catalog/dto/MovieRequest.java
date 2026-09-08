package com.eventix.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovieRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String genre;
    private String language;

    @Positive(message = "Duration must be a positive number of minutes")
    private Integer durationMinutes;

    private String posterUrl;
    private Double rating;
}
