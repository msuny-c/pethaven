package com.pethaven.model;

import com.pethaven.model.enums.ApplicationStatus;

import java.time.OffsetDateTime;

public record AdoptionApplication(
        Long id,
        Long animalId,
        Long candidateId,
        ApplicationStatus status,
        OffsetDateTime createdAt
) {
}
