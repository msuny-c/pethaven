package com.pethaven.repository;

import com.pethaven.entity.VolunteerMentorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VolunteerMentorRepository extends JpaRepository<VolunteerMentorEntity, Long> {

    java.util.Optional<VolunteerMentorEntity> findByVolunteerId(Long volunteerId);
}
