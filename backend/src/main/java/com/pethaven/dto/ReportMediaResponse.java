package com.pethaven.dto;

import java.time.OffsetDateTime;

public record ReportMediaResponse(
        Long id,
        String description,
        String url,
        OffsetDateTime uploadedAt
) {
}
