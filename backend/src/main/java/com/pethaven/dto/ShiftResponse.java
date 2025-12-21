package com.pethaven.dto;

import com.pethaven.model.enums.ShiftType;

import java.time.LocalDate;

public record ShiftResponse(
        Long id,
        LocalDate shiftDate,
        ShiftType shiftType
) {
}
