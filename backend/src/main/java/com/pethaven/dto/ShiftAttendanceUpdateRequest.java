package com.pethaven.dto;

import com.pethaven.model.enums.AttendanceStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ShiftAttendanceUpdateRequest(
        @NotNull @Min(1) Long volunteerId,
        @NotNull AttendanceStatus status,
        @Min(0) Integer workedHours
) {
}
