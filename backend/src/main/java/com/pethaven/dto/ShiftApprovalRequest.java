package com.pethaven.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ShiftApprovalRequest(
        @NotNull @Min(1) Long volunteerId,
        @Min(0) Integer workedHours
) {
}
