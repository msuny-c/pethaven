package com.pethaven.repository;

import com.pethaven.entity.InterviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<InterviewEntity, Long> {
    List<InterviewEntity> findByApplicationIdOrderByScheduledDatetimeDesc(Long applicationId);
}
