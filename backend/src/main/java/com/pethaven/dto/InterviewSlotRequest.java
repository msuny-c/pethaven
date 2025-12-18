package com.pethaven.dto;

import com.pethaven.model.enums.InterviewSlotStatus;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public record InterviewSlotRequest(
        @NotNull Long interviewerId,
        @NotNull @Future OffsetDateTime scheduledAt,
        InterviewSlotStatus status
) {
}
