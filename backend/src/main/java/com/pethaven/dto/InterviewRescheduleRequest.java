package com.pethaven.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record InterviewRescheduleRequest(
        @NotNull @Min(1) Long applicationId,
        @NotNull @Min(1) Long newSlotId
) {
}
