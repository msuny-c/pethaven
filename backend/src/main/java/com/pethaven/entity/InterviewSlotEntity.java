package com.pethaven.entity;

import com.pethaven.model.enums.InterviewSlotStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "interview_slot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InterviewSlotEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "slot_id")
    private Long id;

    @Column(name = "interviewer_id")
    private Long interviewerId;

    @Column(name = "scheduled_datetime")
    private OffsetDateTime scheduledDatetime;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "interview_slot_status")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private InterviewSlotStatus status = InterviewSlotStatus.available;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (status == null) {
            status = InterviewSlotStatus.available;
        }
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
