package com.pethaven.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AgreementRequest(
        @NotNull @Min(1) Long applicationId,
        LocalDate signedDate,
        String postAdoptionPlan
) {
}
