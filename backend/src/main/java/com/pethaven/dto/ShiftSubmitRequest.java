package com.pethaven.dto;

import jakarta.validation.constraints.Min;

public record ShiftSubmitRequest(
        @Min(0) Integer workedHours
) {
}
