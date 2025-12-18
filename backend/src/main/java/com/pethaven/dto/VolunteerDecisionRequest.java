package com.pethaven.dto;

import com.pethaven.model.enums.VolunteerApplicationStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record VolunteerDecisionRequest(
        @NotNull @Min(1) Long applicationId,
        @NotNull VolunteerApplicationStatus status,
        String decisionComment
) {
}
