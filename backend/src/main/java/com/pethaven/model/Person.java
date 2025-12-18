package com.pethaven.model;

import java.time.OffsetDateTime;
import com.pethaven.model.enums.SystemRole;

import java.util.Set;

public record Person(
        Long id,
        String email,
        String firstName,
        String lastName,
        String phoneNumber,
        boolean active,
        OffsetDateTime createdAt,
        Set<SystemRole> roles,
        String avatarUrl
) {
}
