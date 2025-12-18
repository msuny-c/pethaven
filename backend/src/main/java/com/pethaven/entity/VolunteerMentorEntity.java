package com.pethaven.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "volunteer_mentors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VolunteerMentorEntity {

    @Id
    @Column(name = "volunteer_id")
    private Long volunteerId;

    @Column(name = "mentor_id")
    private Long mentorId;

    @Column(name = "orientation_date")
    private OffsetDateTime orientationDate;

    @Column(name = "mentor_feedback")
    private String mentorFeedback;

    @Column(name = "allow_self_shifts")
    private Boolean allowSelfShifts;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;
}
