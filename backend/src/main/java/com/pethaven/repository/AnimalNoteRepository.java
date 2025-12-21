package com.pethaven.repository;

import com.pethaven.entity.AnimalNoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnimalNoteRepository extends JpaRepository<AnimalNoteEntity, Long> {
    List<AnimalNoteEntity> findByAnimalIdOrderByCreatedAtDesc(Long animalId);
}
