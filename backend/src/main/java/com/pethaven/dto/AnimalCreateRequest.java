package com.pethaven.dto;

import com.pethaven.model.enums.AnimalStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnimalCreateRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Size(max = 100) String species,
        @Size(max = 100) String breed,
        @Min(0) Integer ageMonths,
        @NotBlank @Size(max = 50) String gender,
        @Size(max = 1000) String description,
        AnimalStatus status
) {
}
