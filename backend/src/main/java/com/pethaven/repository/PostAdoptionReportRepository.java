package com.pethaven.repository;

import com.pethaven.entity.PostAdoptionReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostAdoptionReportRepository extends JpaRepository<PostAdoptionReportEntity, Long> {
    @Query(value = "SELECT process_post_adoption_reports()", nativeQuery = true)
    Integer processPendingReports();

    @Query(value = """
            SELECT r.*
            FROM post_adoption_report r
            JOIN agreement ag ON ag.agreement_id = r.agreement_id
            JOIN adoption_application aa ON aa.application_id = ag.application_id
            WHERE aa.candidate_id = :candidateId
            ORDER BY r.due_date
            """, nativeQuery = true)
    List<PostAdoptionReportEntity> findByCandidate(Long candidateId);

    @Query(value = """
            SELECT r.*
            FROM post_adoption_report r
            JOIN agreement ag ON ag.agreement_id = r.agreement_id
            JOIN adoption_application aa ON aa.application_id = ag.application_id
            WHERE r.report_id = :reportId AND aa.candidate_id = :candidateId
            """, nativeQuery = true)
    Optional<PostAdoptionReportEntity> findByIdAndCandidate(Long reportId, Long candidateId);

    @Query(value = """
            SELECT r.report_id    AS id,
                   r.agreement_id AS agreementId,
                   r.due_date     AS dueDate,
                   r.submitted_date AS submittedDate,
                   r.report_text  AS reportText,
                   r.volunteer_feedback AS volunteerFeedback,
                   r.status       AS status,
                   aa.animal_id   AS animalId,
                   ag.application_id AS applicationId,
                   an.name        AS animalName
            FROM post_adoption_report r
                     JOIN agreement ag ON ag.agreement_id = r.agreement_id
                     JOIN adoption_application aa ON aa.application_id = ag.application_id
                     LEFT JOIN animal an ON an.animal_id = aa.animal_id
            WHERE aa.candidate_id = :candidateId
            ORDER BY r.due_date
            """, nativeQuery = true)
    List<PostAdoptionReportProjection> findDetailedByCandidate(Long candidateId);

    @Query(value = """
            SELECT EXISTS (
                SELECT 1 FROM post_adoption_report
                WHERE agreement_id = :agreementId AND status = CAST(:status AS report_status)
            )
            """, nativeQuery = true)
    boolean existsByAgreementIdAndStatus(Long agreementId, String status);
}
