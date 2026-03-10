package com.gyan.entertainment.service.impl;

import com.gyan.entertainment.dto.request.MovieRequest;
import com.gyan.entertainment.dto.response.MovieResponse;
import com.gyan.entertainment.entity.Movie;
import com.gyan.entertainment.exception.BadRequestException;
import com.gyan.entertainment.exception.ResourceNotFoundException;
import com.gyan.entertainment.repository.MovieRepository;
import com.gyan.entertainment.service.MovieService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements MovieService {

    private final MovieRepository movieRepository;

    @Override
    public MovieResponse create(MovieRequest request) {
        log.info("Creating movie: {}", request.getTitle());

        // ✅ Business rule: no duplicates
        if (movieRepository.existsByTitleAndReleaseYear(request.getTitle(), request.getReleaseYear())) {
            throw new BadRequestException("Movie already exists with title and year: "
                    + request.getTitle() + " (" + request.getReleaseYear() + ")");
        }

        Movie movie = Movie.builder()
                .title(request.getTitle())
                .genre(request.getGenre())
                .releaseYear(request.getReleaseYear())
                .rating(request.getRating())
                .build();

        Movie saved = movieRepository.save(movie);
        log.info("Movie created with id: {}", saved.getId());
        return toResponse(saved);
    }

    @Override
    public MovieResponse getById(Long id) {
        log.info("Fetching movie by id: {}", id);
        Movie movie = findOrThrow(id);
        return toResponse(movie);
    }

    @Override
    public List<MovieResponse> getAll() {
        log.info("Fetching all movies");
        return movieRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MovieResponse> getByGenre(String genre) {
        log.info("Fetching movies by genre: {}", genre);
        return movieRepository.findByGenre(genre)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public MovieResponse update(Long id, MovieRequest request) {
        log.info("Updating movie id: {}", id);
        Movie movie = findOrThrow(id);

        movie.setTitle(request.getTitle());
        movie.setGenre(request.getGenre());
        movie.setReleaseYear(request.getReleaseYear());
        movie.setRating(request.getRating());

        Movie updated = movieRepository.save(movie);
        log.info("Movie updated: {}", id);
        return toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        log.info("Deleting movie id: {}", id);
        Movie movie = findOrThrow(id);
        movieRepository.delete(movie);
        log.info("Movie deleted: {}", id);
    }

    // ─── Private Helpers ────────────────────────────────────────

    private Movie findOrThrow(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", id));
    }

    private MovieResponse toResponse(Movie movie) {
        return MovieResponse.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .genre(movie.getGenre())
                .releaseYear(movie.getReleaseYear())
                .rating(movie.getRating())
                .createdAt(movie.getCreatedAt())
                .build();
    }
}