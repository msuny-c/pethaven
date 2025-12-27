package com.pethaven.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record TaskShiftUpdateRequest(
        @NotNull @Min(1) Long taskId,
        String progressNotes,
        String taskState,
        @Min(0) Integer workedHours
) {
}
