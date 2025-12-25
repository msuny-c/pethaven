package com.pethaven.dto;

import com.pethaven.model.enums.ReportStatus;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;

public record PostAdoptionReportRequest(
        @Min(1) Long agreementId,
        LocalDate dueDate,
        String reportText,
        String volunteerFeedback,
        LocalDate submittedDate,
        ReportStatus status
) {
}
