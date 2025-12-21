package com.pethaven.dto;

import com.pethaven.model.enums.InterviewStatus;

import java.time.OffsetDateTime;

public record InterviewResponse(
        Long id,
        Long applicationId,
        Long interviewerId,
        OffsetDateTime scheduledDatetime,
        InterviewStatus status,
        String coordinatorNotes,
        Long processedBy
) {
}
