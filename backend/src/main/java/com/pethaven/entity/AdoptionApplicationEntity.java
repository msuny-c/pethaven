package com.pethaven.entity;

import com.pethaven.model.enums.ApplicationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "adoption_application")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdoptionApplicationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "application_id")
    private Long id;

    @Column(name = "animal_id")
    private Long animalId;

    @Column(name = "candidate_id")
    private Long candidateId;

    private String reason;
    private String experience;
    private String housing;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "application_status")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private ApplicationStatus status = ApplicationStatus.submitted;

    @Column(name = "decision_comment")
    private String decisionComment;

    @Column(name = "processed_by")
    private Long processedBy;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (status == null) {
            status = ApplicationStatus.submitted;
        }
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
