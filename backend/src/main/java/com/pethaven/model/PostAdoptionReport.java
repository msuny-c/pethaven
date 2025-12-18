package com.pethaven.model;

import com.pethaven.model.enums.ReportStatus;

import java.time.LocalDate;

public record PostAdoptionReport(
        Long id,
        Long agreementId,
        LocalDate dueDate,
        LocalDate submittedDate,
        String reportText,
        String volunteerFeedback,
        ReportStatus status
) {
}
