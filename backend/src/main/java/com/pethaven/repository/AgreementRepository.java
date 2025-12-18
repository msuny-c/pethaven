package com.pethaven.repository;

import com.pethaven.entity.AgreementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AgreementRepository extends JpaRepository<AgreementEntity, Long> {
}
