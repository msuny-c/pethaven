package com.pethaven.model;

import com.pethaven.model.enums.NotificationType;

import java.time.OffsetDateTime;

public record Notification(
        Long id,
        Long personId,
        NotificationType type,
        String title,
        String message,
        OffsetDateTime createdAt
) {
}
