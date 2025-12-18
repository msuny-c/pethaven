package com.pethaven.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UserStatusRequest(
        @NotNull @Min(1) Long personId,
        boolean active
) {
}
