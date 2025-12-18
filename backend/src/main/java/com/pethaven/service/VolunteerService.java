package com.pethaven.service;

import com.pethaven.dto.OrientationRequest;
import com.pethaven.dto.OrientationApprovalRequest;
import com.pethaven.entity.VolunteerMentorEntity;
import com.pethaven.repository.VolunteerMentorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VolunteerService {

    private final VolunteerMentorRepository mentorRepository;

    public VolunteerService(VolunteerMentorRepository mentorRepository) {
        this.mentorRepository = mentorRepository;
    }

    public List<VolunteerMentorEntity> getAssignments() {
        return mentorRepository.findAll();
    }

    @Transactional
    public VolunteerMentorEntity assignOrientation(OrientationRequest request) {
        VolunteerMentorEntity entity = mentorRepository.findById(request.volunteerId())
                .orElseGet(VolunteerMentorEntity::new);
        entity.setVolunteerId(request.volunteerId());
        entity.setMentorId(request.mentorId());
        entity.setOrientationDate(request.orientationDate());
        entity.setMentorFeedback(request.mentorFeedback());
        if (request.orientationDate() != null) {
            entity.setApprovedAt(null);
            entity.setAllowSelfShifts(Boolean.FALSE);
        }
        return mentorRepository.save(entity);
    }

    @Transactional
    public VolunteerMentorEntity approveOrientation(OrientationApprovalRequest request) {
        VolunteerMentorEntity entity = mentorRepository.findByVolunteerId(request.volunteerId())
                .orElseThrow(() -> new IllegalArgumentException("Назначение наставника не найдено"));
        if (request.mentorFeedback() != null) {
            entity.setMentorFeedback(request.mentorFeedback());
        }
        if (request.allowSelfShifts() != null) {
            entity.setAllowSelfShifts(request.allowSelfShifts());
        } else {
            entity.setAllowSelfShifts(Boolean.TRUE);
        }
        entity.setApprovedAt(java.time.OffsetDateTime.now());
        return mentorRepository.save(entity);
    }
}
