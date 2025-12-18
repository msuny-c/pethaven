package com.pethaven.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record TaskShiftAssignmentRequest(
        @NotNull @Min(1) Long taskId,
        @NotNull @Min(1) Long shiftId,
        String progressNotes
) {
}
