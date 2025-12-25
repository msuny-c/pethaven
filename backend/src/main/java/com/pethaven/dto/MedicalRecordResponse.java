package com.pethaven.dto;

import java.time.LocalDate;

public record MedicalRecordResponse(
        Long id,
        Long animalId,
        Long vetId,
        String vetFirstName,
        String vetLastName,
        String procedure,
        String description,
        LocalDate nextDueDate
) {
}
