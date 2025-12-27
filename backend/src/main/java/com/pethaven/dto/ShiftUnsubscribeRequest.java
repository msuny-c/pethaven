package com.pethaven.dto;

import jakarta.validation.constraints.NotBlank;

public record ShiftUnsubscribeRequest(
        @NotBlank String reason
) {
}
