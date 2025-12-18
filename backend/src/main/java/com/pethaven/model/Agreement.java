package com.pethaven.model;

import java.time.LocalDate;

public record Agreement(
        Long id,
        Long applicationId,
        LocalDate signedDate,
        String postAdoptionPlan
) {
}
