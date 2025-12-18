package com.pethaven.dto;

import com.pethaven.model.enums.SystemRole;

import java.util.Set;

public record AuthResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String phoneNumber,
        Set<SystemRole> roles,
        String accessToken,
        String refreshToken,
        String avatarUrl
) {
}
