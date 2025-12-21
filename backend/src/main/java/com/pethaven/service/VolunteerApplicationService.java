package com.pethaven.service;

import com.pethaven.dto.VolunteerApplicationRequest;
import com.pethaven.dto.VolunteerDecisionRequest;
import com.pethaven.entity.VolunteerApplicationEntity;
import com.pethaven.model.enums.VolunteerApplicationStatus;
import com.pethaven.repository.VolunteerApplicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VolunteerApplicationService {

    private final VolunteerApplicationRepository applicationRepository;

    public VolunteerApplicationService(VolunteerApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
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
        return applicationRepository.submit(personId, request.motivation(), request.availability());
    }

    public List<VolunteerApplicationEntity> list(Long personId) {
        if (personId != null) {
            return applicationRepository.findByPersonId(personId);
        } else {
            return applicationRepository.findAll();
        }
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
