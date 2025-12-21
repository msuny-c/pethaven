package com.pethaven.dto;

import com.pethaven.model.enums.ApplicationStatus;

import java.time.OffsetDateTime;

public record AdoptionApplicationResponse(
        Long id,
        Long animalId,
        Long candidateId,
        String reason,
        String experience,
        String housing,
        ApplicationStatus status,
        String decisionComment,
        Long processedBy,
        OffsetDateTime createdAt
) {
}
