package com.pethaven.repository;

import java.time.LocalDate;

/**
 * Проекция отчета с данными по животному для кандидата.
 */
public interface PostAdoptionReportProjection {
    Long getId();
    Long getAgreementId();
    LocalDate getDueDate();
    LocalDate getSubmittedDate();
    String getReportText();
    String getVolunteerFeedback();
    String getStatus();
    Long getAnimalId();
    Long getApplicationId();
    String getAnimalName();
    Long getAuthorId();
    String getAuthorFirstName();
    String getAuthorLastName();
    String getAuthorAvatar();
}
