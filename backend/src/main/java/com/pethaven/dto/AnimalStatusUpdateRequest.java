package com.pethaven.dto;

import com.pethaven.model.enums.AnimalStatus;
import jakarta.validation.constraints.NotNull;

public record AnimalStatusUpdateRequest(
        @NotNull AnimalStatus status
) {
}
