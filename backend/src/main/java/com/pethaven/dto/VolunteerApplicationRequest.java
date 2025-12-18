package com.pethaven.dto;

import jakarta.validation.constraints.NotBlank;

public record VolunteerApplicationRequest(
        @NotBlank String motivation,
        String availability
) {
}
