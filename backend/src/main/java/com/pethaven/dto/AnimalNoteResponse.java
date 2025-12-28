package com.pethaven.dto;

import java.time.OffsetDateTime;

public record AnimalNoteResponse(
        Long id,
        Long animalId,
        Long authorId,
        String authorFirstName,
        String authorLastName,
        String authorAvatar,
        String note,
        OffsetDateTime createdAt
) {
}
