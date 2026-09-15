package com.eventix.catalog.service;

import com.eventix.catalog.dto.MovieRequest;
import com.eventix.catalog.dto.MovieResponse;
import com.eventix.catalog.exception.ResourceNotFoundException;
import com.eventix.catalog.model.Movie;
import com.eventix.catalog.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final S3UploadService s3UploadService;

    public MovieResponse create(MovieRequest request) {
        Movie movie = Movie.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .genre(request.getGenre())
                .language(request.getLanguage())
                .durationMinutes(request.getDurationMinutes())
                .posterUrl(request.getPosterUrl())
                .rating(request.getRating())
                .build();
        return toResponse(movieRepository.save(movie));
    }

    public List<MovieResponse> findAll() {
        return movieRepository.findAll().stream().map(this::toResponse).toList();
    }

    public MovieResponse findById(Long id) {
        return toResponse(getOrThrow(id));
    }

    public MovieResponse update(Long id, MovieRequest request) {
        Movie movie = getOrThrow(id);
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setGenre(request.getGenre());
        movie.setLanguage(request.getLanguage());
        movie.setDurationMinutes(request.getDurationMinutes());
        movie.setPosterUrl(request.getPosterUrl());
        movie.setRating(request.getRating());
        return toResponse(movieRepository.save(movie));
    }

    public void delete(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Movie " + id + " not found");
        }
        movieRepository.deleteById(id);
    }

    public MovieResponse updatePoster(Long id, MultipartFile file) {
        Movie movie = getOrThrow(id);
        movie.setPosterUrl(s3UploadService.upload("posters", file));
        return toResponse(movieRepository.save(movie));
    }

    Movie getOrThrow(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie " + id + " not found"));
    }

    private MovieResponse toResponse(Movie m) {
        return new MovieResponse(m.getId(), m.getTitle(), m.getDescription(), m.getGenre(),
                m.getLanguage(), m.getDurationMinutes(), m.getPosterUrl(), m.getRating());
    }
}
