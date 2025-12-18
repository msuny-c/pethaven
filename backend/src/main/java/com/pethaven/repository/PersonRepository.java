package com.pethaven.repository;

import com.pethaven.entity.PersonEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface PersonRepository extends JpaRepository<PersonEntity, Long> {
    @EntityGraph(attributePaths = "roles")
    Optional<PersonEntity> findByEmail(String email);

    @Query("select p from PersonEntity p join p.roles r where r.name = :roleName and (p.active is null or p.active = true)")
    List<PersonEntity> findActiveByRole(@Param("roleName") String roleName);
}
