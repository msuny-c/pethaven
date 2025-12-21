package com.pethaven.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record MedicalRecordRequest(
        @NotNull @Min(1) Long animalId,
        @NotBlank String procedure,
        @NotBlank String description,
        LocalDate nextDueDate
) {
}
