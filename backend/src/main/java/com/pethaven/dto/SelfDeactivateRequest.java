package com.pethaven.dto;

import jakarta.validation.constraints.NotBlank;

public record SelfDeactivateRequest(
        @NotBlank String password
) {
}
