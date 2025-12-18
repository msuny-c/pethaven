package com.pethaven.model;

import com.pethaven.model.enums.InterviewStatus;

import java.time.OffsetDateTime;

public record Interview(
        Long id,
        Long applicationId,
        Long interviewerId,
        OffsetDateTime scheduledAt,
        InterviewStatus status,
        String notes
) {
}
