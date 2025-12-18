package com.pethaven.dto;

import com.pethaven.model.enums.SystemRole;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record UpdateRolesRequest(
        @NotNull @Min(1) Long personId,
        @NotEmpty Set<SystemRole> roles
) {
}
