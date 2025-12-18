package com.pethaven.dto;

import com.pethaven.model.enums.SystemRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UserCreateRequest(
        @Email @NotBlank String email,
        @Size(min = 8) String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        String phoneNumber,
        @NotEmpty Set<SystemRole> roles
) {
}
