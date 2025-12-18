package com.pethaven.dto;

import com.pethaven.model.enums.ReportStatus;
import com.pethaven.repository.PostAdoptionReportProjection;

import java.time.LocalDate;

public record PostAdoptionReportDto(
        Long id,
        Long agreementId,
        Long applicationId,
        Long animalId,
        String animalName,
        LocalDate dueDate,
        LocalDate submittedDate,
        String reportText,
        String volunteerFeedback,
        ReportStatus status
) {
    public static PostAdoptionReportDto fromProjection(PostAdoptionReportProjection projection) {
        return new PostAdoptionReportDto(
                projection.getId(),
                projection.getAgreementId(),
                projection.getApplicationId(),
                projection.getAnimalId(),
                projection.getAnimalName(),
                projection.getDueDate(),
                projection.getSubmittedDate(),
                projection.getReportText(),
                projection.getVolunteerFeedback(),
                projection.getStatus() != null ? ReportStatus.valueOf(projection.getStatus()) : ReportStatus.pending
        );
    }
}
