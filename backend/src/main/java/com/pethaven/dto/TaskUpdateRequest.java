package com.pethaven.dto;

import com.pethaven.model.enums.TaskStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TaskUpdateRequest(
        @Size(max = 255) String title,
        @Size(max = 2000) String description,
        @Min(1) Long animalId,
        TaskStatus status,
        @Min(1) Integer estimatedShifts,
        LocalDate dueDate
) {
}
