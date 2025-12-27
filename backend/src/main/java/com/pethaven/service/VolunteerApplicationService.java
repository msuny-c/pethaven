package com.pethaven.service;

import com.pethaven.dto.VolunteerApplicationRequest;
import com.pethaven.dto.VolunteerDecisionRequest;
import com.pethaven.entity.VolunteerApplicationEntity;
import com.pethaven.model.enums.VolunteerApplicationStatus;
import com.pethaven.repository.VolunteerApplicationRepository;
import com.pethaven.repository.PersonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VolunteerApplicationService {

    private final VolunteerApplicationRepository applicationRepository;
    private final PersonRepository personRepository;

    public VolunteerApplicationService(VolunteerApplicationRepository applicationRepository,
                                       PersonRepository personRepository) {
        this.applicationRepository = applicationRepository;
        this.personRepository = personRepository;
    }

    @Transactional
    public Long submit(VolunteerApplicationRequest request, Long personId) {
        if (personId == null) {
            throw new IllegalArgumentException("personId is required");
        }
        if (applicationRepository.existsByPersonIdAndStatusIn(personId,
                java.util.List.of(VolunteerApplicationStatus.submitted, VolunteerApplicationStatus.under_review))) {
            throw new IllegalStateException("Активная анкета уже подана");
        }
        VolunteerApplicationEntity entity = new VolunteerApplicationEntity();
        entity.setPersonId(personId);
        entity.setMotivation(request.motivation());
        entity.setAvailability(request.availability());
        entity.setFirstName(request.firstName());
        entity.setLastName(request.lastName());
        entity.setEmail(request.email());
        entity.setPhone(request.phone());
        personRepository.findById(personId).ifPresent(person -> {
            if (entity.getFirstName() == null || entity.getFirstName().isBlank()) {
                entity.setFirstName(person.getFirstName());
            }
            if (entity.getLastName() == null || entity.getLastName().isBlank()) {
                entity.setLastName(person.getLastName());
            }
            if (entity.getEmail() == null || entity.getEmail().isBlank()) {
                entity.setEmail(person.getEmail());
            }
            if (entity.getPhone() == null || entity.getPhone().isBlank()) {
                entity.setPhone(person.getPhoneNumber());
            }
        });
        entity.setStatus(VolunteerApplicationStatus.submitted);
        return applicationRepository.save(entity).getId();
    }

    public List<VolunteerApplicationEntity> list(Long personId) {
        if (personId != null) {
            return applicationRepository.findByPersonId(personId);
        } else {
            return applicationRepository.findAll();
        }
    }

    public java.util.Optional<VolunteerApplicationEntity> getOne(Long id, Long personId) {
        if (personId != null) {
            return applicationRepository.findById(id).filter(app -> app.getPersonId().equals(personId));
        }
        return applicationRepository.findById(id);
    }

    @Transactional
    public void decide(VolunteerDecisionRequest request) {
        VolunteerApplicationEntity application = applicationRepository.findById(request.applicationId())
                .orElseThrow(() -> new IllegalArgumentException("Заявка волонтёра не найдена"));
        if (application.getStatus() == VolunteerApplicationStatus.approved || application.getStatus() == VolunteerApplicationStatus.rejected) {
            throw new IllegalStateException("Решение по этой заявке уже зафиксировано");
        }
        applicationRepository.decide(request.applicationId(), request.status().name(), request.decisionComment());
    }
}
