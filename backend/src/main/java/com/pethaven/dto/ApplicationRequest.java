package com.pethaven.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ApplicationRequest(
        @NotNull @Min(1) Long animalId,
        String reason,
        String experience,
        String housing
) {
}
