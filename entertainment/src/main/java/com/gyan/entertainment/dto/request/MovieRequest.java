package com.gyan.entertainment.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class MovieRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Genre is required")
    private String genre;

    @NotNull(message = "Release year is required")
    @Min(value = 1888, message = "Release year must be after 1888")
    @Max(value = 2100, message = "Release year seems invalid")
    private Integer releaseYear;

    @NotNull(message = "Rating is required")
    @DecimalMin(value = "0.0", message = "Rating must be at least 0.0")
    @DecimalMax(value = "10.0", message = "Rating must be at most 10.0")
    private BigDecimal rating;
}