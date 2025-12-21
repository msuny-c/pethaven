package com.pethaven.dto;

import com.pethaven.model.enums.TaskStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record TaskResponse(
        Long id,
        String title,
        String description,
        Long animalId,
        TaskStatus status,
        Integer estimatedShifts,
        LocalDate dueDate,
        OffsetDateTime updatedAt
) {
}
