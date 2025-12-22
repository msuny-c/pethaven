package com.pethaven.service;

import com.pethaven.dto.AdoptionDecisionRequest;
import com.pethaven.dto.AgreementConfirmRequest;
import com.pethaven.dto.AgreementRequest;
import com.pethaven.dto.ApplicationRequest;
import com.pethaven.dto.InterviewRescheduleRequest;
import com.pethaven.dto.InterviewSlotBookRequest;
import com.pethaven.dto.InterviewSlotCancelRequest;
import com.pethaven.dto.InterviewUpdateRequest;
import com.pethaven.dto.PostAdoptionReportRequest;
import com.pethaven.entity.AdoptionApplicationEntity;
import com.pethaven.entity.AgreementEntity;
import com.pethaven.entity.AnimalEntity;
import com.pethaven.entity.InterviewEntity;
import com.pethaven.model.enums.ReportStatus;
import com.pethaven.model.enums.ApplicationStatus;
import com.pethaven.model.enums.InterviewStatus;
import com.pethaven.model.enums.SystemRole;
import com.pethaven.repository.AdoptionApplicationRepository;
import com.pethaven.repository.AgreementRepository;
import com.pethaven.repository.AnimalRepository;
import com.pethaven.repository.InterviewRepository;
import com.pethaven.repository.InterviewSlotRepository;
import com.pethaven.repository.PersonRepository;
import com.pethaven.service.ObjectStorageService.StorageFile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class AdoptionService {

    private final AdoptionApplicationRepository adoptionRepository;
    private final InterviewRepository interviewRepository;
    private final AgreementRepository agreementRepository;
    private final InterviewSlotRepository interviewSlotRepository;
    private final AnimalRepository animalRepository;
    private final NotificationService notificationService;
    private final PersonRepository personRepository;
    private final ObjectStorageService storageService;
    private final PostAdoptionReportService postAdoptionReportService;

    public AdoptionService(AdoptionApplicationRepository adoptionRepository,
                           InterviewRepository interviewRepository,
                           AgreementRepository agreementRepository,
                           InterviewSlotRepository interviewSlotRepository,
                           AnimalRepository animalRepository,
                           NotificationService notificationService,
                           PersonRepository personRepository,
                           ObjectStorageService storageService,
                           PostAdoptionReportService postAdoptionReportService) {
        this.adoptionRepository = adoptionRepository;
        this.interviewRepository = interviewRepository;
        this.agreementRepository = agreementRepository;
        this.interviewSlotRepository = interviewSlotRepository;
        this.animalRepository = animalRepository;
        this.notificationService = notificationService;
        this.personRepository = personRepository;
        this.storageService = storageService;
        this.postAdoptionReportService = postAdoptionReportService;
    }

    @Transactional
    public Long submitApplication(ApplicationRequest request, MultipartFile passport, Long candidateId) {
        if (candidateId == null) {
            throw new IllegalArgumentException("candidateId is required");
        }
        if (!Boolean.TRUE.equals(request.consentGiven())) {
            throw new IllegalArgumentException("Необходимо согласие на обработку данных");
        }
        if (passport == null || passport.isEmpty()) {
            throw new IllegalStateException("Требуется загрузить документ");
        }
        animalRepository.findById(request.animalId()).ifPresent(animal -> {
            if (Boolean.TRUE.equals(animal.getPendingAdminReview())) {
                throw new IllegalStateException("Карточка питомца на проверке, подача заявки недоступна");
            }
        });
        if (adoptionRepository.existsByCandidateIdAndAnimalIdAndStatusIn(candidateId, request.animalId(),
                List.of(ApplicationStatus.submitted, ApplicationStatus.under_review, ApplicationStatus.approved))) {
            throw new IllegalStateException("Активная заявка на этого питомца уже существует");
        }
        Long id;
        try {
            id = adoptionRepository.submit(request.animalId(), candidateId);
        } catch (DataAccessException ex) {
            throw new IllegalStateException(normalizeDbMessage(ex));
        }
        adoptionRepository.findById(id).ifPresent(entity -> {
            entity.setReason(request.reason());
            entity.setExperience(request.experience());
            entity.setHousing(request.housing());
            entity.setConsentGiven(Boolean.TRUE);
            String key = storageService.uploadPassport(id, passport);
            entity.setPassportKey(key);
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
                return adoptionRepository.findActiveByCandidateIdAndStatus(candidateId, status);
            }
            return adoptionRepository.findActiveByCandidateId(candidateId);
        }
        if (status != null) {
            return adoptionRepository.findByStatus(status);
        }
        return adoptionRepository.findAll();
    }

    public Optional<AdoptionApplicationEntity> getApplication(Long id) {
        return adoptionRepository.findById(id);
    }

    public void updateStatus(AdoptionDecisionRequest request, Long actorId) {
        adoptionRepository.findById(request.applicationId()).ifPresent(entity -> {
            entity.setStatus(request.status());
            String comment = (request.decisionComment() == null || request.decisionComment().isBlank())
                    ? "Комментарий отсутствует"
                    : request.decisionComment();
            entity.setDecisionComment(comment);
            if (actorId != null) {
                entity.setProcessedBy(actorId);
            }
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
                cancelInterviews(entity.getId());
            }
            notificationService.push(entity.getCandidateId(),
                    com.pethaven.model.enums.NotificationType.new_application,
                    "Статус заявки обновлен",
                    "Заявка №" + entity.getId() + " теперь " + humanStatus(entity.getStatus()));
        });
    }

    @Transactional
    public void cancelByCandidate(Long applicationId, Long candidateId, String reason) {
        AdoptionApplicationEntity app = adoptionRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
        if (!candidateId.equals(app.getCandidateId())) {
            throw new org.springframework.security.access.AccessDeniedException("Нельзя отменить чужую заявку");
        }
        app.setStatus(ApplicationStatus.rejected);
        app.setDecisionComment((reason == null || reason.isBlank()) ? "Отменено кандидатом" : "Отменено кандидатом: " + reason);
        adoptionRepository.save(app);
        animalRepository.findById(app.getAnimalId()).ifPresent(animal -> {
            if (animal.getStatus() == com.pethaven.model.enums.AnimalStatus.reserved) {
                animal.setStatus(com.pethaven.model.enums.AnimalStatus.available);
                animalRepository.save(animal);
            }
        });
        cancelInterviews(app.getId());
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
    public void declineInterview(Long interviewId, Long candidateId) {
        InterviewEntity interview = interviewRepository.findById(interviewId).orElseThrow();
        AdoptionApplicationEntity app = adoptionRepository.findById(interview.getApplicationId()).orElseThrow();
        if (candidateId == null || !candidateId.equals(app.getCandidateId())) {
            throw new org.springframework.security.access.AccessDeniedException("Нельзя отклонить чужое интервью");
        }
        if (interview.getStatus() == InterviewStatus.completed) {
            throw new IllegalStateException("Нельзя отклонить проведенное интервью");
        }
        interview.setStatus(InterviewStatus.cancelled);
        interviewRepository.save(interview);

        app.setStatus(ApplicationStatus.rejected);
        app.setDecisionComment("Кандидат отклонил интервью");
        adoptionRepository.save(app);

        animalRepository.findById(app.getAnimalId()).ifPresent(animal -> {
            if (animal.getStatus() == com.pethaven.model.enums.AnimalStatus.reserved) {
                animal.setStatus(com.pethaven.model.enums.AnimalStatus.available);
                animalRepository.save(animal);
            }
        });

        notificationService.push(interview.getInterviewerId(),
                com.pethaven.model.enums.NotificationType.interview_scheduled,
                "Кандидат отказался",
                "Кандидат отказался от интервью по заявке №" + app.getId());
    }

    @Transactional
    public void reschedule(InterviewRescheduleRequest request, Long candidateId, boolean isAdmin) {
        InterviewEntity interview = interviewRepository.findById(request.interviewId()).orElseThrow();
        AdoptionApplicationEntity app = adoptionRepository.findById(interview.getApplicationId()).orElseThrow();

        if (!isAdmin && candidateId != null && !candidateId.equals(app.getCandidateId())) {
            throw new org.springframework.security.access.AccessDeniedException("Нельзя перенести чужое интервью");
        }

        interviewSlotRepository.expireOld(java.time.OffsetDateTime.now());
        interviewSlotRepository.book(request.newSlotId(), app.getId());
        interview.setStatus(InterviewStatus.scheduled);
        interviewRepository.save(interview);
    }

    @Transactional
    public void updateInterview(InterviewUpdateRequest request, Long uid, boolean isAdmin) {
        InterviewEntity interview = interviewRepository.findById(request.interviewId()).orElseThrow();
        AdoptionApplicationEntity app = adoptionRepository.findById(interview.getApplicationId()).orElseThrow();

        if (!isAdmin && (uid == null || (!uid.equals(interview.getInterviewerId()) && !uid.equals(app.getCandidateId())))) {
            throw new org.springframework.security.access.AccessDeniedException("Нет прав редактировать интервью");
        }

        if (request.status() != null) {
            interview.setStatus(request.status());
        }
        if (request.notes() != null) {
            interview.setCoordinatorNotes(request.notes());
        }

        interviewRepository.save(interview);
    }

    @Transactional(readOnly = true)
    public List<AgreementEntity> getAgreements() {
        return agreementRepository.findAll();
    }

    @Transactional
    public String attachPassport(Long applicationId, Long candidateId, MultipartFile file) {
        AdoptionApplicationEntity app = adoptionRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
        if (!candidateId.equals(app.getCandidateId())) {
            throw new org.springframework.security.access.AccessDeniedException("Нельзя загружать документ в чужую заявку");
        }
        String key = storageService.uploadPassport(applicationId, file);
        app.setPassportKey(key);
        adoptionRepository.save(app);
        return key;
    }

    public StorageFile downloadPassport(Long applicationId) {
        AdoptionApplicationEntity app = adoptionRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
        if (app.getPassportKey() == null) {
            throw new IllegalStateException("Паспорт не загружен");
        }
        return storageService.download(app.getPassportKey());
    }

    @Transactional
    public AgreementEntity createAgreement(AgreementRequest request) {
        AdoptionApplicationEntity app = adoptionRepository.findById(request.applicationId())
                .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
        if (app.getPassportKey() == null) {
            throw new IllegalStateException("Не загружен паспорт кандидата");
        }
        if (agreementRepository.findAll().stream().anyMatch(a -> a.getApplicationId().equals(request.applicationId()))) {
            throw new IllegalStateException("Договор по этой заявке уже создан");
        }
        AnimalEntity animal = animalRepository.findById(app.getAnimalId())
                .orElseThrow(() -> new IllegalArgumentException("Животное не найдено"));
        if (!Boolean.TRUE.equals(animal.getReadyForAdoption())) {
            throw new IllegalStateException("Ветеринар не подтвердил готовность к передаче");
        }
        AgreementEntity agreement = new AgreementEntity();
        agreement.setApplicationId(request.applicationId());
        agreement.setPostAdoptionPlan(request.postAdoptionPlan());
        agreement.setGeneratedAt(java.time.OffsetDateTime.now());
        agreementRepository.saveAndFlush(agreement);
        byte[] template = generatePlaceholderDocx(app, animal);
        String key = storageService.uploadAgreementTemplate(agreement.getId(), template);
        agreement.setTemplateStorageKey(key);
        agreementRepository.save(agreement);
        return agreement;
    }

    @Transactional
    public AgreementEntity uploadSignedAgreement(Long agreementId, Long candidateId, MultipartFile file) {
        AgreementEntity agreement = agreementRepository.findById(agreementId)
                .orElseThrow(() -> new IllegalArgumentException("Договор не найден"));
        AdoptionApplicationEntity app = adoptionRepository.findById(agreement.getApplicationId())
                .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
        if (!candidateId.equals(app.getCandidateId())) {
            throw new org.springframework.security.access.AccessDeniedException("Можно загрузить только для своей заявки");
        }
        String key = storageService.uploadSignedAgreement(agreementId, file);
        agreement.setSignedStorageKey(key);
        agreement.setSignedAt(java.time.OffsetDateTime.now());
        agreementRepository.save(agreement);
        return agreement;
    }

    @Transactional
    public AgreementEntity confirmAgreement(Long agreementId, Long coordinatorId, AgreementConfirmRequest request) {
        AgreementEntity agreement = agreementRepository.findById(agreementId)
                .orElseThrow(() -> new IllegalArgumentException("Договор не найден"));
        if (agreement.getSignedStorageKey() == null) {
            throw new IllegalStateException("Нет подписанного договора");
        }
        AdoptionApplicationEntity app = adoptionRepository.findById(agreement.getApplicationId())
                .orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
        AnimalEntity animal = animalRepository.findById(app.getAnimalId())
                .orElseThrow(() -> new IllegalArgumentException("Животное не найдено"));
        agreement.setSignedDate(request.signedDate());
        agreement.setConfirmedAt(java.time.OffsetDateTime.now());
        agreement.setConfirmedBy(coordinatorId);
        agreementRepository.save(agreement);

        app.setStatus(ApplicationStatus.approved);
        adoptionRepository.save(app);
        animal.setStatus(com.pethaven.model.enums.AnimalStatus.adopted);
        animalRepository.save(animal);

        postAdoptionReportService.create(new PostAdoptionReportRequest(
                agreementId,
                java.time.LocalDate.now(),
                null,
                null,
                null,
                ReportStatus.pending
        ));
        return agreement;
    }

    public StorageFile downloadAgreementFile(Long agreementId, boolean signed) {
        AgreementEntity agreement = agreementRepository.findById(agreementId)
                .orElseThrow(() -> new IllegalArgumentException("Договор не найден"));
        String key = signed ? agreement.getSignedStorageKey() : agreement.getTemplateStorageKey();
        if (key == null) {
            throw new IllegalStateException(signed ? "Подписанный договор отсутствует" : "Шаблон договора ещё не сформирован");
        }
        return storageService.download(key);
    }

    public Optional<AgreementEntity> getAgreement(Long id) {
        return agreementRepository.findById(id);
    }

    private void cancelInterviews(Long applicationId) {
        interviewRepository.findByApplicationIdOrderByScheduledDatetimeDesc(applicationId).forEach(interview -> {
            interview.setStatus(InterviewStatus.cancelled);
            interviewRepository.save(interview);
        });
    }

    private String humanStatus(ApplicationStatus status) {
        return switch (status) {
            case submitted -> "Подана";
            case under_review -> "На проверке";
            case approved -> "Одобрена";
            case rejected -> "Отклонена";
        };
    }

    private void notifyCoordinators(String title, String message) {
        personRepository.findActiveByRole(SystemRole.coordinator.name()).forEach(p -> notificationService.push(
                p.getId(),
                com.pethaven.model.enums.NotificationType.new_application,
                title,
                message
        ));
    }

    private byte[] generatePlaceholderDocx(AdoptionApplicationEntity app, AnimalEntity animal) {
        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            try (ZipOutputStream zip = new ZipOutputStream(bos)) {
                addEntry(zip, "[Content_Types].xml", loadTemplate("templates/agreement-docx/[Content_Types].xml"));
                addEntry(zip, "_rels/.rels", loadTemplate("templates/agreement-docx/_rels/.rels"));
                String doc = loadTemplate("templates/agreement-docx/word/document.xml")
                        .replace("{{PET_NAME}}", animal.getName() == null ? "pet" : animal.getName());
                addEntry(zip, "word/document.xml", doc);
            }
            return bos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Не удалось сгенерировать шаблон договора", e);
        }
    }

    private String loadTemplate(String path) throws IOException {
        ClassPathResource resource = new ClassPathResource(path);
        try (var is = resource.getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private void addEntry(ZipOutputStream zip, String path, String content) throws IOException {
        zip.putNextEntry(new ZipEntry(path));
        zip.write(content.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    private String normalizeDbMessage(DataAccessException ex) {
        Throwable cause = ex.getMostSpecificCause();
        String message = cause != null && cause.getMessage() != null ? cause.getMessage() : ex.getMessage();
        if (message == null) {
            return "Не удалось создать заявку";
        }
        if (message.contains("Animal is not available for adoption")) {
            return "Питомец недоступен для подачи заявки";
        }
        return message;
    }
}
