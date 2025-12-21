package com.pethaven.dto;

import java.time.LocalDate;

public record MedicalRecordResponse(
        Long id,
        Long animalId,
        Long vetId,
        String procedure,
        String description,
        LocalDate nextDueDate
) {
}
