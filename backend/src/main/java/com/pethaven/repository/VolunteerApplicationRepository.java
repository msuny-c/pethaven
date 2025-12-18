package com.pethaven.repository;

import com.pethaven.entity.VolunteerApplicationEntity;
import com.pethaven.model.enums.VolunteerApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VolunteerApplicationRepository extends JpaRepository<VolunteerApplicationEntity, Long> {

    List<VolunteerApplicationEntity> findByPersonId(Long personId);

    List<VolunteerApplicationEntity> findByStatus(VolunteerApplicationStatus status);
    boolean existsByPersonIdAndStatusIn(Long personId, List<VolunteerApplicationStatus> statuses);

    @Query(value = "SELECT submit_volunteer_application(CAST(:personId AS integer), :motivation, :availability)", nativeQuery = true)
    Long submit(@Param("personId") Long personId,
                @Param("motivation") String motivation,
                @Param("availability") String availability);

    @Modifying
    @Query(value = "CALL decide_volunteer_application(:applicationId, CAST(:status AS volunteer_application_status), :comment)", nativeQuery = true)
    void decide(@Param("applicationId") Long applicationId,
                @Param("status") String status,
                @Param("comment") String comment);
}
