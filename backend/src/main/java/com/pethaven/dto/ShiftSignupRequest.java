package com.pethaven.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ShiftSignupRequest(
        @NotNull @Min(1) Long shiftId
) {
}
