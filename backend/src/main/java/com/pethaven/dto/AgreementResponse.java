package com.pethaven.dto;

import java.time.LocalDate;

public record AgreementResponse(
        Long id,
        Long applicationId,
        LocalDate signedDate,
        String postAdoptionPlan
) {
}
