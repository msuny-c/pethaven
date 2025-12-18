package com.pethaven.repository;

import com.pethaven.entity.ReportMediaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportMediaRepository extends JpaRepository<ReportMediaEntity, Long> {
    List<ReportMediaEntity> findByReportIdOrderByUploadedAtDesc(Long reportId);
}
