package com.pethaven.service;

import com.pethaven.dto.AdoptionDecisionRequest;
import com.pethaven.dto.ApplicationRequest;
import com.pethaven.dto.AgreementRequest;
import com.pethaven.dto.InterviewUpdateRequest;
import com.pethaven.dto.InterviewSlotRequest;
import com.pethaven.dto.InterviewSlotBookRequest;
import com.pethaven.dto.InterviewSlotCancelRequest;
import com.pethaven.dto.InterviewRescheduleRequest;
import com.pethaven.entity.AdoptionApplicationEntity;
import com.pethaven.entity.AgreementEntity;
import com.pethaven.entity.InterviewEntity;
import com.pethaven.entity.InterviewSlotEntity;
import com.pethaven.entity.AnimalEntity;
import com.pethaven.model.enums.ApplicationStatus;
import com.pethaven.model.enums.InterviewStatus;
import com.pethaven.model.enums.InterviewSlotStatus;
import com.pethaven.model.enums.SystemRole;
import com.pethaven.repository.AdoptionApplicationRepository;
import com.pethaven.repository.AgreementRepository;
import com.pethaven.repository.InterviewRepository;
import com.pethaven.repository.InterviewSlotRepository;
import com.pethaven.repository.AnimalRepository;
import com.pethaven.repository.MedicalRecordRepository;
import com.pethaven.repository.PersonRepository;
import com.pethaven.repository.PostAdoptionReportRepository;
import com.pethaven.entity.PostAdoptionReportEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AdoptionService {

    private final AdoptionApplicationRepository adoptionRepository;
    private final InterviewRepository interviewRepository;
    private final AgreementRepository agreementRepository;
    private final InterviewSlotRepository interviewSlotRepository;
    private final AnimalRepository animalRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final NotificationService notificationService;
    private final PersonRepository personRepository;
    private final PostAdoptionReportRepository reportRepository;
    private final SettingService settingService;

    public AdoptionService(AdoptionApplicationRepository adoptionRepository,
                           InterviewRepository interviewRepository,
                           AgreementRepository agreementRepository,
                           InterviewSlotRepository interviewSlotRepository,
                           AnimalRepository animalRepository,
                           MedicalRecordRepository medicalRecordRepository,
                           NotificationService notificationService,
                           PersonRepository personRepository,
                           PostAdoptionReportRepository reportRepository,
                           SettingService settingService) {
        this.adoptionRepository = adoptionRepository;
        this.interviewRepository = interviewRepository;
        this.agreementRepository = agreementRepository;
        this.interviewSlotRepository = interviewSlotRepository;
        this.animalRepository = animalRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.notificationService = notificationService;
        this.personRepository = personRepository;
        this.reportRepository = reportRepository;
        this.settingService = settingService;
    }

    @Transactional
    public Long submitApplication(ApplicationRequest request, Long candidateId) {
        if (candidateId == null) {
            throw new IllegalArgumentException("candidateId is required");
        }
        if (adoptionRepository.existsByCandidateIdAndAnimalIdAndStatusIn(candidateId, request.animalId(),
                java.util.List.of(ApplicationStatus.submitted, ApplicationStatus.under_review, ApplicationStatus.approved))) {
            throw new IllegalStateException("Активная заявка на этого питомца уже существует");
        }
        Long id = adoptionRepository.submit(request.animalId(), candidateId);
        adoptionRepository.findById(id).ifPresent(entity -> {
            entity.setReason(request.reason());
            entity.setExperience(request.experience());
            entity.setHousing(request.housing());
            adoptionRepository.save(entity);
        });
        String animalName = animalRepository.findById(request.animalId())
                .map(AnimalEntity::getName)
                .orElse("питомца #" + request.animalId());
        String applicantName = personRepository.findById(candidateId)
                .map(p -> {
                    String full = ((p.getFirstName() != null ? p.getFirstName() : "") + " " + (p.getLastName() != null ? p.getLastName() : "")).trim();
                    return !full.isBlank() ? full : p.getEmail();
                })
                .orElse("Кандидат #" + candidateId);
        notifyCoordinators(
                "Новая заявка",
                applicantName + " подал(а) заявку на " + animalName + " (№" + id + ")"
        );
        return id;
    }

    public List<AdoptionApplicationEntity> getApplications(ApplicationStatus status, Long candidateId) {
        if (candidateId != null) {
            if (status != null) {
                return adoptionRepository.findByCandidateIdAndStatus(candidateId, status);
            }
            return adoptionRepository.findByCandidateId(candidateId);
        }
        if (status != null) {
            return adoptionRepository.findByStatus(status);
        }
        return adoptionRepository.findAll();
    }

    public Optional<AdoptionApplicationEntity> getApplication(Long id) {
        return adoptionRepository.findById(id);
    }

    public void updateStatus(AdoptionDecisionRequest request) {
        adoptionRepository.findById(request.applicationId()).ifPresent(entity -> {
            entity.setStatus(request.status());
            String comment = (request.decisionComment() == null || request.decisionComment().isBlank())
                    ? "Комментарий отсутствует"
                    : request.decisionComment();
            entity.setDecisionComment(comment);
            adoptionRepository.save(entity);
            if (request.status() == ApplicationStatus.approved) {
                animalRepository.findById(entity.getAnimalId()).ifPresent(animal -> {
                    animal.setStatus(com.pethaven.model.enums.AnimalStatus.reserved);
                    animalRepository.save(animal);
                });
            } else if (request.status() == ApplicationStatus.rejected) {
                animalRepository.findById(entity.getAnimalId()).ifPresent(animal -> {
                    if (animal.getStatus() == com.pethaven.model.enums.AnimalStatus.reserved) {
                        animal.setStatus(com.pethaven.model.enums.AnimalStatus.available);
                        animalRepository.save(animal);
                    }
                });
            }
            notificationService.push(entity.getCandidateId(),
                    com.pethaven.model.enums.NotificationType.new_application,
                    "Статус заявки обновлен",
                    "Заявка №" + entity.getId() + " теперь " + humanStatus(entity.getStatus()));
        });
    }

    @Transactional
    public void scheduleInterview(Long applicationId, Long interviewerId, java.time.OffsetDateTime scheduledAt) {
        if (scheduledAt == null || !scheduledAt.isAfter(java.time.OffsetDateTime.now())) {
            throw new IllegalArgumentException("Время интервью должно быть в будущем");
        }
        AdoptionApplicationEntity app = adoptionRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
        if (app.getStatus() == ApplicationStatus.approved || app.getStatus() == ApplicationStatus.rejected) {
            throw new IllegalStateException("Нельзя назначить интервью для завершенной заявки");
        }
        adoptionRepository.scheduleInterview(applicationId, interviewerId, scheduledAt);
        if (app.getStatus() == ApplicationStatus.submitted) {
            app.setStatus(ApplicationStatus.under_review);
        }
        adoptionRepository.save(app);
    }

    public List<InterviewEntity> getInterviewsByApplication(Long applicationId) {
        return interviewRepository.findByApplicationIdOrderByScheduledDatetimeDesc(applicationId);
    }

    public List<InterviewEntity> getAllInterviews() {
        return interviewRepository.findAll();
    }

    public List<InterviewSlotEntity> getSlots(InterviewSlotStatus status, Long interviewerId) {
        if (interviewerId != null) {
            return interviewSlotRepository.findByInterviewerId(interviewerId);
        }
        if (status != null) {
            return interviewSlotRepository.findByStatusOrderByScheduledDatetimeAsc(status);
        }
        return interviewSlotRepository.findAll();
    }

    public InterviewSlotEntity createSlot(InterviewSlotRequest request) {
        InterviewSlotEntity entity = new InterviewSlotEntity();
        entity.setInterviewerId(request.interviewerId());
        entity.setScheduledDatetime(request.scheduledAt());
        if (request.status() != null) {
            entity.setStatus(request.status());
        }
        return interviewSlotRepository.save(entity);
    }

    public void cancelSlot(Long slotId) {
        interviewSlotRepository.cancel(slotId);
    }

    @Transactional
    public Long bookSlot(InterviewSlotBookRequest request, Long candidateId) {
        interviewSlotRepository.expireOld(java.time.OffsetDateTime.now());
        if (candidateId != null) {
            adoptionRepository.findById(request.applicationId()).ifPresent(app -> {
                if (!candidateId.equals(app.getCandidateId())) {
                    throw new IllegalStateException("Нельзя бронировать слот для чужой заявки");
                }
            });
        }
        return interviewSlotRepository.book(request.slotId(), request.applicationId());
    }

    @Transactional
    public void cancelSlot(InterviewSlotCancelRequest request, Long candidateId, boolean isAdmin) {
        AdoptionApplicationEntity app = adoptionRepository.findById(request.applicationId()).orElseThrow();
        if (!isAdmin && candidateId != null && !candidateId.equals(app.getCandidateId())) {
            throw new org.springframework.security.access.AccessDeniedException("Нельзя отменить чужую заявку");
        }
        interviewSlotRepository.cancelBooking(request.slotId(), request.applicationId());
    }

    @Transactional
    public void confirmInterview(Long interviewId, Long candidateId) {
        InterviewEntity interview = interviewRepository.findById(interviewId).orElseThrow();
        AdoptionApplicationEntity app = adoptionRepository.findById(interview.getApplicationId()).orElseThrow();
        if (candidateId == null || !candidateId.equals(app.getCandidateId())) {
            throw new org.springframework.security.access.AccessDeniedException("Нельзя подтвердить чужое интервью");
        }
        if (interview.getStatus() != InterviewStatus.scheduled) {
            throw new IllegalStateException("Можно подтвердить только запланированное интервью");
        }
        interview.setStatus(InterviewStatus.confirmed);
        interviewRepository.save(interview);
        notificationService.push(interview.getInterviewerId(),
                com.pethaven.model.enums.NotificationType.interview_scheduled,
                "Кандидат подтвердил интервью",
                "Интервью по заявке №" + app.getId() + " подтверждено кандидатом");
    }

    @Transactional
    public void reschedule(InterviewRescheduleRequest request, Long candidateId, boolean isAdmin) {
        AdoptionApplicationEntity app = adoptionRepository.findById(request.applicationId())
                .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
        if (!isAdmin && candidateId != null && !candidateId.equals(app.getCandidateId())) {
            throw new org.springframework.security.access.AccessDeniedException("Нельзя переносить чужую заявку");
        }
        cancelExistingInterviews(app, candidateId, isAdmin);
        InterviewSlotBookRequest bookRequest = new InterviewSlotBookRequest(request.newSlotId(), request.applicationId());
        bookSlot(bookRequest, candidateId);
    }

    private void cancelExistingInterviews(AdoptionApplicationEntity app, Long actorId, boolean isAdmin) {
        List<InterviewEntity> interviews = interviewRepository.findByApplicationIdOrderByScheduledDatetimeDesc(app.getId());
        for (InterviewEntity interview : interviews) {
            boolean isOwnerCandidate = actorId != null && actorId.equals(app.getCandidateId());
            boolean isInterviewer = actorId != null && actorId.equals(interview.getInterviewerId());
            if (!isAdmin && !(isOwnerCandidate || isInterviewer)) {
                throw new org.springframework.security.access.AccessDeniedException("Нет прав на изменение интервью");
            }
            interview.setStatus(InterviewStatus.cancelled);
        }
        interviewRepository.saveAll(interviews);
    }

    @Transactional
    public void updateInterview(InterviewUpdateRequest request, Long actorId, boolean isAdmin) {
        InterviewEntity interview = interviewRepository.findById(request.interviewId())
                .orElseThrow();
        if (!isAdmin && actorId != null && !actorId.equals(interview.getInterviewerId())) {
            throw new org.springframework.security.access.AccessDeniedException("Можно редактировать только свои интервью");
        }
        interview.setStatus(request.status());
        interview.setCoordinatorNotes(request.notes());
        interviewRepository.save(interview);
        if (request.status() == InterviewStatus.completed && request.autoApproveApplicationId() != null) {
            adoptionRepository.findById(request.autoApproveApplicationId()).ifPresent(app -> {
                if (app.getStatus() == ApplicationStatus.under_review || app.getStatus() == ApplicationStatus.submitted) {
                    app.setStatus(ApplicationStatus.approved);
                    app.setDecisionComment(request.notes());
                    adoptionRepository.save(app);
                    animalRepository.findById(app.getAnimalId()).ifPresent(animal -> {
                        animal.setStatus(com.pethaven.model.enums.AnimalStatus.reserved);
                        animalRepository.save(animal);
                    });
                    notificationService.push(app.getCandidateId(),
                            com.pethaven.model.enums.NotificationType.interview_scheduled,
                            "Результат интервью",
                            "Заявка №" + app.getId() + " одобрена после интервью");
                }
            });
        } else if (request.status() == InterviewStatus.completed) {
            AdoptionApplicationEntity app = adoptionRepository.findById(interview.getApplicationId()).orElseThrow();
            app.setStatus(ApplicationStatus.rejected);
            app.setDecisionComment(request.notes());
            adoptionRepository.save(app);
            animalRepository.findById(app.getAnimalId()).ifPresent(animal -> {
                if (animal.getStatus() == com.pethaven.model.enums.AnimalStatus.reserved) {
                    animal.setStatus(com.pethaven.model.enums.AnimalStatus.available);
                    animalRepository.save(animal);
                }
            });
            notificationService.push(app.getCandidateId(),
                    com.pethaven.model.enums.NotificationType.interview_scheduled,
                    "Результат интервью",
                    "Заявка №" + app.getId() + " отклонена после интервью");
        } else if (request.status() == InterviewStatus.cancelled) {
            AdoptionApplicationEntity app = adoptionRepository.findById(interview.getApplicationId()).orElseThrow();
            if (app.getStatus() != ApplicationStatus.approved && app.getStatus() != ApplicationStatus.rejected) {
                app.setStatus(ApplicationStatus.under_review);
                adoptionRepository.save(app);
            }
            notificationService.push(app.getCandidateId(),
                    com.pethaven.model.enums.NotificationType.interview_scheduled,
                    "Интервью отменено",
                    "Интервью по заявке №" + app.getId() + " было отменено");
        }
    }

    private String humanStatus(ApplicationStatus status) {
        return switch (status) {
            case submitted -> "подана";
            case under_review -> "на рассмотрении";
            case approved -> "одобрена";
            case rejected -> "отклонена";
        };
    }

    @Transactional
    public Long completeAdoption(AgreementRequest request) {
        AdoptionApplicationEntity application = adoptionRepository.findById(request.applicationId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        AnimalEntity animal = animalRepository.findById(application.getAnimalId())
                .orElseThrow(() -> new IllegalStateException("Animal not found"));
        if (animal.getStatus() == com.pethaven.model.enums.AnimalStatus.quarantine
                || animal.getStatus() == com.pethaven.model.enums.AnimalStatus.not_available) {
            throw new IllegalStateException("Животное недоступно для передачи, требуется завершить мед. требования");
        }
        var medRecords = medicalRecordRepository.findByAnimalIdOrderByAdministeredDateDesc(animal.getId());
        if (medRecords.isEmpty()) {
            throw new IllegalStateException("Отсутствует медицинская карта питомца");
        }
        boolean hasPendingMed = medRecords.stream()
                .anyMatch(rec -> rec.getNextDueDate() != null && rec.getNextDueDate().isBefore(java.time.LocalDate.now()));
        if (hasPendingMed && !(Boolean.TRUE.equals(animal.getVaccinated()) && Boolean.TRUE.equals(animal.getSterilized()) && Boolean.TRUE.equals(animal.getMicrochipped()))) {
            throw new IllegalStateException("Есть незакрытые медицинские процедуры");
        }
        Long agreementId = adoptionRepository.completeAdoption(request.applicationId(), request.signedDate(), request.postAdoptionPlan());
        createPostAdoptionPlan(agreementId, request.signedDate());
        notificationService.push(application.getCandidateId(),
                com.pethaven.model.enums.NotificationType.new_application,
                "Передача оформлена",
                "Поздравляем! Передача питомца завершена, следуйте графику отчётов.");
        return agreementId;
    }

    public Optional<AgreementEntity> getAgreement(Long id) {
        return agreementRepository.findById(id);
    }

    public List<AgreementEntity> getAgreements() {
        return agreementRepository.findAll();
    }

    private void notifyCoordinators(String title, String message) {
        personRepository.findActiveByRole(SystemRole.coordinator.name())
                .forEach(person -> notificationService.push(
                        person.getId(),
                        com.pethaven.model.enums.NotificationType.new_application,
                        title,
                        message
                ));
    }

    private void createPostAdoptionPlan(Long agreementId, java.time.LocalDate signedDate) {
        if (agreementId == null) {
            return;
        }
        int offsetDays = settingService.getReportOffsetDays();
        int fillDays = settingService.getReportFillDays();
        int total = Math.max(1, offsetDays + fillDays);
        PostAdoptionReportEntity entity = new PostAdoptionReportEntity();
        entity.setAgreementId(agreementId);
        entity.setDueDate(signedDate.plusDays(total));
        entity.setStatus(com.pethaven.model.enums.ReportStatus.pending);
        reportRepository.save(entity);
    }
}
