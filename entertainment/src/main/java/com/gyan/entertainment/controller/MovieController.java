package com.gyan.entertainment.controller;

import com.gyan.entertainment.dto.request.MovieRequest;
import com.gyan.entertainment.dto.response.MovieResponse;
import com.gyan.entertainment.response.ApiResponse;
import com.gyan.entertainment.service.MovieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    // ✅ POST /api/v1/movies
    @PostMapping
    public ResponseEntity<ApiResponse<MovieResponse>> create(@Valid @RequestBody MovieRequest request) {
        MovieResponse response = movieService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Movie created successfully", response));
    }

    // ✅ GET /api/v1/movies/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MovieResponse>> getById(@PathVariable Long id) {
        MovieResponse response = movieService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Movie fetched successfully", response));
    }

    // ✅ GET /api/v1/movies
    @GetMapping
    public ResponseEntity<ApiResponse<List<MovieResponse>>> getAll() {
        List<MovieResponse> movies = movieService.getAll();
        return ResponseEntity.ok(ApiResponse.success("Movies fetched successfully", movies));
    }

    // ✅ GET /api/v1/movies/genre/{genre}
    @GetMapping("/genre/{genre}")
    public ResponseEntity<ApiResponse<List<MovieResponse>>> getByGenre(@PathVariable String genre) {
        List<MovieResponse> movies = movieService.getByGenre(genre);
        return ResponseEntity.ok(ApiResponse.success("Movies fetched by genre", movies));
    }

    // ✅ PUT /api/v1/movies/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MovieResponse>> update(@PathVariable Long id,
                                                             @Valid @RequestBody MovieRequest request) {
        MovieResponse response = movieService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Movie updated successfully", response));
    }

    // ✅ DELETE /api/v1/movies/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        movieService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Movie deleted successfully"));
    }
}