package com.pethaven.dto;

import com.pethaven.model.enums.ReportStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PostAdoptionReportRequest(
        @NotNull @Min(1) Long agreementId,
        @NotNull LocalDate dueDate,
        String reportText,
        String volunteerFeedback,
        LocalDate submittedDate,
        ReportStatus status
) {
}
