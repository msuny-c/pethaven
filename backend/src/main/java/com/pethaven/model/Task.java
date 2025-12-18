package com.pethaven.model;

import com.pethaven.model.enums.TaskStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record Task(
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
