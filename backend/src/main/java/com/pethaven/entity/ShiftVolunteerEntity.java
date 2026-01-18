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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

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
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "attendance_status")
    private AttendanceStatus attendanceStatus = AttendanceStatus.signed_up;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @Column(name = "worked_hours")
    private Integer workedHours = 0;

    @Column(name = "signed_up_at")
    private OffsetDateTime signedUpAt;

    @Column(name = "volunteer_feedback")
    private String volunteerFeedback;

    @Column(name = "cancel_reason")
    private String cancelReason;

    @PrePersist
    void onCreate() {
        if (attendanceStatus == null) {
            attendanceStatus = AttendanceStatus.signed_up;
        }
        if (workedHours == null) {
            workedHours = 0;
        }
    }
}
