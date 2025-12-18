package com.pethaven.dto;

import com.pethaven.model.enums.ApplicationStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AdoptionDecisionRequest(
        @NotNull @Min(1) Long applicationId,
        @NotNull ApplicationStatus status,
        String decisionComment
) {
}
