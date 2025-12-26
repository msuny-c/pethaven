package com.pethaven.dto;

import jakarta.validation.constraints.NotNull;

public record AdminUserUpdateRequest(
        @NotNull Long personId,
        String firstName,
        String lastName,
        String phoneNumber
) {
}
