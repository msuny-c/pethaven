package com.pethaven.model;

import com.pethaven.model.enums.ShiftType;

import java.time.LocalDate;

public record Shift(
        Long id,
        LocalDate shiftDate,
        ShiftType type
) {
}
