package com.pethaven.entity;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.pethaven.model.enums.AttendanceStatus;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "shift_volunteer")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShiftVolunteerEntity {

    @EmbeddedId
    @JsonUnwrapped
    private ShiftVolunteerId id;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status")
    private AttendanceStatus attendanceStatus = AttendanceStatus.signed_up;

    @PrePersist
    void onCreate() {
        if (attendanceStatus == null) {
            attendanceStatus = AttendanceStatus.signed_up;
        }
    }
}
