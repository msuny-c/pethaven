package com.pethaven.dto;

import java.time.LocalDate;

public record AgreementResponse(
        Long id,
        Long applicationId,
        LocalDate signedDate,
        String postAdoptionPlan,
        String templateUrl,
        String signedUrl,
        java.time.OffsetDateTime generatedAt,
        java.time.OffsetDateTime signedAt,
        java.time.OffsetDateTime confirmedAt,
        Long confirmedBy
) {
}
