package com.pethaven.dto;

import com.pethaven.model.enums.ReportStatus;

import java.time.LocalDate;

public record PostAdoptionReportResponse(
        Long id,
        Long agreementId,
        LocalDate dueDate,
        LocalDate submittedDate,
        String reportText,
        String volunteerFeedback,
        ReportStatus status,
        Long commentAuthorId
) {
}
