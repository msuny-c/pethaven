package com.pethaven.dto;

import java.time.OffsetDateTime;

public record AnimalNoteResponse(
        Long id,
        Long animalId,
        Long authorId,
        String note,
        OffsetDateTime createdAt
) {
}
