package com.pethaven.model;

import java.time.LocalDate;

public record MedicalRecord(
        Long id,
        Long animalId,
        Long vetId,
        String procedure,
        String description,
        LocalDate administeredDate,
        LocalDate nextDueDate
) {
}
