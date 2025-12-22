package com.pethaven.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AgreementConfirmRequest(
        @NotNull LocalDate signedDate
) {
}
