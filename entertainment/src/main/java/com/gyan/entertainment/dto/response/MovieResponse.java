package com.gyan.entertainment.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class MovieResponse {

    private Long id;
    private String title;
    private String genre;
    private Integer releaseYear;
    private BigDecimal rating;
    private LocalDateTime createdAt;
}