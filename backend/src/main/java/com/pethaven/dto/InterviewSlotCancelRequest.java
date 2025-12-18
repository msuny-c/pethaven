package com.pethaven.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record InterviewSlotCancelRequest(
        @NotNull @Min(1) Long slotId,
        @NotNull @Min(1) Long applicationId
) {
}
