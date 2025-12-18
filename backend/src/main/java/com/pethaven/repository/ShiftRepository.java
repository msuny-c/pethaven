package com.pethaven.repository;

import com.pethaven.entity.ShiftEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShiftRepository extends JpaRepository<ShiftEntity, Long> {
    List<ShiftEntity> findByShiftDateGreaterThanEqualOrderByShiftDateAsc(LocalDate fromDate);

    @Modifying
    @Query(value = "CALL signup_for_shift(CAST(:shiftId AS integer), CAST(:volunteerId AS integer))", nativeQuery = true)
    void signup(@Param("shiftId") Long shiftId, @Param("volunteerId") Long volunteerId);
}
