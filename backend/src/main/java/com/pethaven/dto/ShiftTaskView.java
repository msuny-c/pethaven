package com.pethaven.dto;

import java.time.OffsetDateTime;

public record ShiftTaskView(
        Long taskId,
        Long shiftId,
        String title,
        String description,
        Long animalId,
        String animalName,
        String progressNotes,
        String taskState,
        OffsetDateTime completedAt,
        Long completedBy,
        String completedByName,
        Integer workedHours
) {
}
