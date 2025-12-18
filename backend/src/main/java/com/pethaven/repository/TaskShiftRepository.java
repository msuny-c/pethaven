package com.pethaven.repository;

import com.pethaven.entity.TaskShiftEntity;
import com.pethaven.entity.TaskShiftId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskShiftRepository extends JpaRepository<TaskShiftEntity, TaskShiftId> {
    List<TaskShiftEntity> findByIdShiftId(Long shiftId);
    List<TaskShiftEntity> findByIdTaskId(Long taskId);
}
