package com.pethaven.entity;

import com.pethaven.model.enums.VolunteerApplicationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "volunteer_application")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VolunteerApplicationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "application_id")
    private Long id;

    @Column(name = "person_id")
    private Long personId;

    private String motivation;
    private String availability;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "volunteer_application_status")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private VolunteerApplicationStatus status = VolunteerApplicationStatus.submitted;

    @Column(name = "decision_comment")
    private String decisionComment;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (status == null) {
            status = VolunteerApplicationStatus.submitted;
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
