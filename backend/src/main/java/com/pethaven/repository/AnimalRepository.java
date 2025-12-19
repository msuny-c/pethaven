package com.pethaven.repository;

import com.pethaven.entity.AnimalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnimalRepository extends JpaRepository<AnimalEntity, Long> {

    @Query(value = """
            SELECT *
            FROM animal
            WHERE (:species IS NULL OR species = :species)
              AND (:status IS NULL OR status::text = :status)
            ORDER BY status, animal_id
            """, nativeQuery = true)
    List<AnimalEntity> findCatalog(@Param("species") String species, @Param("status") String status);

    @Query(value = "SELECT DISTINCT species FROM animal WHERE status = 'available'", nativeQuery = true)
    List<String> findAvailableSpecies();
}
