package com.pethaven.dto;

import jakarta.validation.constraints.NotBlank;

public record VolunteerApplicationRequest(
        @NotBlank String motivation,
        String availability,
        String firstName,
        String lastName,
        String email,
        String phone
) {
}
