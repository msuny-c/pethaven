package com.pethaven.repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public interface PostAdoptionReportReminderProjection {
    Long getId();
    Long getAgreementId();
    LocalDate getDueDate();
    String getStatus();
    OffsetDateTime getLastRemindedAt();
    Long getCandidateId();
}
