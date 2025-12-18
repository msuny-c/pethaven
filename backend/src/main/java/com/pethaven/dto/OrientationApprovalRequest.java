package com.pethaven.dto;

import jakarta.validation.constraints.NotNull;

public record OrientationApprovalRequest(
        @NotNull Long volunteerId,
        Boolean allowSelfShifts,
        String mentorFeedback
) {
}
