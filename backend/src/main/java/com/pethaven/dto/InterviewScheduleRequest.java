package com.pethaven.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public record InterviewScheduleRequest(
        @NotNull Long applicationId,
        @NotNull @Future OffsetDateTime scheduledAt
) {
}
