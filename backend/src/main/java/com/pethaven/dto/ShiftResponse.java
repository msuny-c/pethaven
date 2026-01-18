package com.pethaven.dto;

import com.pethaven.model.enums.ShiftType;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ShiftResponse(
        Long id,
        LocalDate shiftDate,
        ShiftType shiftType,
        OffsetDateTime closedAt
) {
}
