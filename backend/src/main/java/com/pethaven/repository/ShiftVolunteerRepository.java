package com.pethaven.repository;

import com.pethaven.entity.ShiftVolunteerEntity;
import com.pethaven.entity.ShiftVolunteerId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShiftVolunteerRepository extends JpaRepository<ShiftVolunteerEntity, ShiftVolunteerId> {
    List<ShiftVolunteerEntity> findByIdShiftId(Long shiftId);
    List<ShiftVolunteerEntity> findByIdVolunteerId(Long volunteerId);
}
