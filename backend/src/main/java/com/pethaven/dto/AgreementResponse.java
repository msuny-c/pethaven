package com.pethaven.dto;

public record AgreementResponse(
        Long id,
        Long applicationId,
        String postAdoptionPlan,
        String templateUrl,
        String signedUrl,
        java.time.OffsetDateTime generatedAt,
        java.time.OffsetDateTime signedAt,
        java.time.OffsetDateTime confirmedAt,
        Long confirmedBy,
        Long coordinatorId,
        String coordinatorFirstName,
        String coordinatorLastName,
        String coordinatorPhone,
        String coordinatorAvatar
) {
}
