package com.pethaven.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AgreementRequest(
        @NotNull @Min(1) Long applicationId,
        @NotNull LocalDate signedDate,
        @NotBlank String postAdoptionPlan
) {
}
