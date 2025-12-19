package com.pethaven.entity;

import com.pethaven.model.enums.InterviewStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "interview")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InterviewEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "interview_id")
    private Long id;

    @Column(name = "application_id")
    private Long applicationId;

    @Column(name = "interviewer_id")
    private Long interviewerId;

    @Column(name = "scheduled_datetime")
    private OffsetDateTime scheduledDatetime;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "interview_status")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private InterviewStatus status = InterviewStatus.scheduled;

    @Column(name = "coordinator_notes")
    private String coordinatorNotes;

    @Column(name = "processed_by")
    private Long processedBy;
}
