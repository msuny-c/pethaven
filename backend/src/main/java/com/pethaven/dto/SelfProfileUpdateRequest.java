package com.pethaven.dto;

import jakarta.validation.constraints.Size;

public record SelfProfileUpdateRequest(
        @Size(max = 100) String firstName,
        @Size(max = 100) String lastName,
        @Size(max = 50) String phoneNumber
) {
}
