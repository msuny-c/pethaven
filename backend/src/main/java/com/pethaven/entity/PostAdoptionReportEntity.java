package com.pethaven.entity;

import com.pethaven.model.enums.ReportStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;

@Entity
@Table(name = "post_adoption_report")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PostAdoptionReportEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long id;

    @Column(name = "agreement_id")
    private Long agreementId;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "submitted_date")
    private LocalDate submittedDate;

    @Column(name = "report_text")
    private String reportText;

    @Column(name = "volunteer_feedback")
    private String volunteerFeedback;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "report_status")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private ReportStatus status = ReportStatus.pending;

    @Column(name = "last_reminded_at")
    private java.time.OffsetDateTime lastRemindedAt;

    @Column(name = "comment_author_id")
    private Long commentAuthorId;
}
