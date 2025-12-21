package com.pethaven.dto;

import jakarta.validation.constraints.Size;

public record AnimalMedicalUpdateRequest(
        Boolean readyForAdoption
) {
}
