package com.pethaven.repository;

import com.pethaven.entity.AnimalMediaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnimalMediaRepository extends JpaRepository<AnimalMediaEntity, Long> {
    List<AnimalMediaEntity> findByAnimalIdOrderByUploadedAtDesc(Long animalId);
}
