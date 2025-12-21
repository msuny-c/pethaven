package com.pethaven.dto;

import com.pethaven.model.enums.ShiftType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ShiftCreateRequest(
        @NotNull LocalDate shiftDate,
        @NotNull ShiftType shiftType
) {
}
