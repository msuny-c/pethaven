package com.pethaven.dto;

import java.time.OffsetDateTime;

public record AnimalMediaResponse(
        Long id,
        String description,
        String url,
        OffsetDateTime uploadedAt
) {
}
