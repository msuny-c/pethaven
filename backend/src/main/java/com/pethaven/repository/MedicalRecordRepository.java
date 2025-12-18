package com.pethaven.repository;

import com.pethaven.entity.MedicalRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecordEntity, Long> {
    List<MedicalRecordEntity> findByAnimalIdOrderByAdministeredDateDesc(Long animalId);

    @Query(value = """
            SELECT *
            FROM medical_record
            WHERE next_due_date IS NOT NULL
              AND next_due_date <= :toDate
            ORDER BY next_due_date ASC
            """, nativeQuery = true)
    List<MedicalRecordEntity> findUpcoming(@Param("toDate") java.time.LocalDate toDate);
}
