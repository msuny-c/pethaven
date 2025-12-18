package com.pethaven.repository;

import com.pethaven.entity.InterviewSlotEntity;
import com.pethaven.model.enums.InterviewSlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface InterviewSlotRepository extends JpaRepository<InterviewSlotEntity, Long> {
    List<InterviewSlotEntity> findByStatusOrderByScheduledDatetimeAsc(InterviewSlotStatus status);

    List<InterviewSlotEntity> findByInterviewerId(Long interviewerId);

    @Modifying
    @Query(value = "UPDATE interview_slot SET status = 'cancelled' WHERE slot_id = :slotId", nativeQuery = true)
    int cancel(@Param("slotId") Long slotId);

    @Query(value = "SELECT book_interview_slot(CAST(:slotId AS integer), CAST(:applicationId AS integer))", nativeQuery = true)
    Long book(@Param("slotId") Long slotId, @Param("applicationId") Long applicationId);

    @Modifying
    @Query(value = "UPDATE interview_slot SET status = 'expired' WHERE scheduled_datetime < :now AND status = 'available'", nativeQuery = true)
    int expireOld(@Param("now") OffsetDateTime now);

    @Modifying
    @Query(value = "SELECT cancel_interview_slot(CAST(:slotId AS integer), CAST(:applicationId AS integer))", nativeQuery = true)
    void cancelBooking(@Param("slotId") Long slotId, @Param("applicationId") Long applicationId);
}
