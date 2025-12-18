package com.pethaven.model;

import com.pethaven.model.enums.AnimalStatus;

public record Animal(
        Long id,
        String name,
        String species,
        String breed,
        Integer ageMonths,
        String behaviorNotes,
        String medicalSummary,
        AnimalStatus status
) {
}
