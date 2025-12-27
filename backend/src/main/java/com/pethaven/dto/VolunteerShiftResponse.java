package com.pethaven.dto;

import com.pethaven.model.enums.AttendanceStatus;
import com.pethaven.model.enums.ShiftType;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record VolunteerShiftResponse(
        Long shiftId,
        LocalDate shiftDate,
        ShiftType shiftType,
        AttendanceStatus attendanceStatus,
        Integer workedHours,
        OffsetDateTime submittedAt,
        OffsetDateTime approvedAt,
        String volunteerFeedback,
        List<ShiftTaskView> tasks
) {
}
