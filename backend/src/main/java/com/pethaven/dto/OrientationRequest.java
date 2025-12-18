package com.pethaven.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public record OrientationRequest(
        @NotNull @Min(1) Long volunteerId,
        @NotNull @Min(1) Long mentorId,
        @FutureOrPresent OffsetDateTime orientationDate,
        String mentorFeedback
) {
}
