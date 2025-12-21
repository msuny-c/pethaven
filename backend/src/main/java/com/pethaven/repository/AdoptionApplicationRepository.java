package com.pethaven.repository;

import com.pethaven.entity.AdoptionApplicationEntity;
import com.pethaven.model.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AdoptionApplicationRepository extends JpaRepository<AdoptionApplicationEntity, Long> {

    List<AdoptionApplicationEntity> findByStatus(ApplicationStatus status);
    List<AdoptionApplicationEntity> findByCandidateId(Long candidateId);
    boolean existsByCandidateIdAndAnimalIdAndStatusIn(Long candidateId, Long animalId, List<ApplicationStatus> statuses);

    @Query("""
            SELECT a
            FROM AdoptionApplicationEntity a
            WHERE a.candidateId = :candidateId
              AND NOT EXISTS (
                SELECT 1 FROM AgreementEntity ag WHERE ag.applicationId = a.id
              )
            """)
    List<AdoptionApplicationEntity> findActiveByCandidateId(@Param("candidateId") Long candidateId);

    @Query("""
            SELECT a
            FROM AdoptionApplicationEntity a
            WHERE a.candidateId = :candidateId
              AND a.status = :status
              AND NOT EXISTS (
                SELECT 1 FROM AgreementEntity ag WHERE ag.applicationId = a.id
              )
            """)
    List<AdoptionApplicationEntity> findActiveByCandidateIdAndStatus(@Param("candidateId") Long candidateId,
                                                                     @Param("status") ApplicationStatus status);

    @Query(value = "SELECT submit_adoption_application(CAST(:animalId AS integer), CAST(:candidateId AS integer))", nativeQuery = true)
    Long submit(@Param("animalId") Long animalId, @Param("candidateId") Long candidateId);

    @Modifying
    @Query(value = "CALL schedule_interview(CAST(:applicationId AS integer), CAST(:interviewerId AS integer), CAST(:scheduledAt AS timestamptz))", nativeQuery = true)
    void scheduleInterview(@Param("applicationId") Long applicationId,
                           @Param("interviewerId") Long interviewerId,
                           @Param("scheduledAt") OffsetDateTime scheduledAt);

    @Query(value = "SELECT complete_adoption(CAST(:applicationId AS integer), CAST(:signedDate AS date), CAST(:plan AS text))", nativeQuery = true)
    Long completeAdoption(@Param("applicationId") Long applicationId,
                          @Param("signedDate") LocalDate signedDate,
                          @Param("plan") String plan);
}
