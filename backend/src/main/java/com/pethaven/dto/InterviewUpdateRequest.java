package com.pethaven.dto;

import com.pethaven.model.enums.InterviewStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record InterviewUpdateRequest(
        @NotNull @Min(1) Long interviewId,
        @NotNull InterviewStatus status,
        String notes,
        Long autoApproveApplicationId
) {
}
