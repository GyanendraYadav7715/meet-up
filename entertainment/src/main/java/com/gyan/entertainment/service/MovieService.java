package com.gyan.entertainment.service;

import com.gyan.entertainment.dto.request.MovieRequest;
import com.gyan.entertainment.dto.response.MovieResponse;

import java.util.List;

public interface MovieService {

    MovieResponse create(MovieRequest request);

    MovieResponse getById(Long id);

    List<MovieResponse> getAll();

    List<MovieResponse> getByGenre(String genre);

    MovieResponse update(Long id, MovieRequest request);

    void delete(Long id);
}