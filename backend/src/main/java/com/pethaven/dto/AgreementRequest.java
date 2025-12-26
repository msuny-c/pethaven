package com.pethaven.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AgreementRequest(
        @NotNull @Min(1) Long applicationId,
        String postAdoptionPlan
) {
}
