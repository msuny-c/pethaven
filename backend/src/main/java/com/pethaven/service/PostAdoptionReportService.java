package com.pethaven.service;

import com.pethaven.dto.PostAdoptionReportDto;
import com.pethaven.dto.PostAdoptionReportRequest;
import com.pethaven.dto.PostAdoptionReportResponse;
import com.pethaven.dto.ReportMediaResponse;
import com.pethaven.entity.PostAdoptionReportEntity;
import com.pethaven.entity.ReportMediaEntity;
import com.pethaven.mapper.ReportMapper;
import com.pethaven.model.enums.ReportStatus;
import com.pethaven.repository.PersonRepository;
import com.pethaven.repository.PostAdoptionReportRepository;
import com.pethaven.repository.ReportMediaRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class PostAdoptionReportService {

    private final PostAdoptionReportRepository reportRepository;
    private final ReportMediaRepository reportMediaRepository;
    private final ObjectStorageService storageService;
    private final SettingService settingService;
    private final NotificationService notificationService;
    private final PersonRepository personRepository;
    private final ReportMapper reportMapper;

    public PostAdoptionReportService(PostAdoptionReportRepository reportRepository,
                                     ReportMediaRepository reportMediaRepository,
                                     ObjectStorageService storageService,
                                     SettingService settingService,
                                     NotificationService notificationService,
                                     PersonRepository personRepository,
                                     ReportMapper reportMapper) {
        this.reportRepository = reportRepository;
        this.reportMediaRepository = reportMediaRepository;
        this.storageService = storageService;
        this.settingService = settingService;
        this.notificationService = notificationService;
        this.personRepository = personRepository;
        this.reportMapper = reportMapper;
    }

    public List<PostAdoptionReportDto> listForCandidate(Long candidateId) {
        int offsetDays = Math.max(0, settingService.getReportOffsetDays());
        int fillDays = settingService.getReportFillDays();

        // Подготовка: если нет ожидающих отчётов и интервал прошёл, создаём новый.
        java.util.List<com.pethaven.entity.PostAdoptionReportEntity> raw = reportRepository.findByCandidate(candidateId);
        java.util.Map<Long, com.pethaven.entity.PostAdoptionReportEntity> lastByAgreement = new java.util.HashMap<>();
        java.util.Set<Long> hasPending = new java.util.HashSet<>();
        for (com.pethaven.entity.PostAdoptionReportEntity r : raw) {
            if (r.getStatus() == ReportStatus.pending || r.getStatus() == ReportStatus.overdue) {
                hasPending.add(r.getAgreementId());
            }
            com.pethaven.entity.PostAdoptionReportEntity last = lastByAgreement.get(r.getAgreementId());
            if (last == null || (r.getDueDate() != null && last.getDueDate() != null && r.getDueDate().isAfter(last.getDueDate()))) {
                lastByAgreement.put(r.getAgreementId(), r);
            }
        }
        java.time.LocalDate today = java.time.LocalDate.now();
        lastByAgreement.forEach((agreementId, last) -> {
            if (hasPending.contains(agreementId)) {
                return;
            }
            if (last.getDueDate() == null) {
                return;
            }
            java.time.LocalDate availableFrom = last.getDueDate().minusDays(fillDays).plusDays(offsetDays);
            java.time.LocalDate nextDue = last.getDueDate().plusDays(offsetDays);
            if (!availableFrom.isAfter(today)) {
                com.pethaven.entity.PostAdoptionReportEntity next = new com.pethaven.entity.PostAdoptionReportEntity();
                next.setAgreementId(agreementId);
                next.setDueDate(nextDue);
                next.setStatus(nextDue.isBefore(today) ? ReportStatus.overdue : ReportStatus.pending);
                reportRepository.save(next);
            }
        });

        return reportRepository.findVisibleDetailedByCandidate(candidateId)
                .stream()
                .map(PostAdoptionReportDto::fromProjection)
                .toList();
    }

    public List<PostAdoptionReportResponse> listAll() {
        return reportMapper.toResponses(reportRepository.findAll());
    }

    public boolean hasReportsForAgreement(Long agreementId) {
        return agreementId != null && reportRepository.existsByAgreementId(agreementId);
    }

    public PostAdoptionReportResponse create(PostAdoptionReportRequest request) {
        if (request.agreementId() == null || request.dueDate() == null) {
            throw new IllegalArgumentException("agreementId и dueDate обязательны для создания отчёта");
        }
        PostAdoptionReportEntity entity = new PostAdoptionReportEntity();
        applyRequest(entity, request);
        PostAdoptionReportEntity saved = reportRepository.save(entity);
        Long candidateId = reportRepository.findCandidateIdByAgreement(request.agreementId());
        if (candidateId != null) {
            notificationService.push(
                    candidateId,
                    com.pethaven.model.enums.NotificationType.report_due,
                    "Новый отчёт",
                    "Заполните отчёт по договору #" + request.agreementId()
            );
        }
        return reportMapper.toResponse(saved);
    }

    public PostAdoptionReportResponse update(Long id, PostAdoptionReportRequest request, Long authorId) {
        PostAdoptionReportEntity entity = reportRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Report not found: " + id));
        ReportStatus previousStatus = entity.getStatus();
        applyRequest(entity, request);
        if (authorId != null && request.volunteerFeedback() != null) {
            entity.setCommentAuthorId(authorId);
        }
        PostAdoptionReportResponse response = reportMapper.toResponse(reportRepository.save(entity));
        if (request.status() == ReportStatus.reviewed && previousStatus != ReportStatus.reviewed) {
            Long candidateId = reportRepository.findCandidateIdByReportId(id);
            if (candidateId != null) {
                notificationService.push(
                        candidateId,
                        com.pethaven.model.enums.NotificationType.report_due,
                        "Отчёт проверен",
                        "Ваш отчёт #" + id + " проверен координатором"
                );
            }
        }
        return response;
    }

    public void submit(Long id, PostAdoptionReportRequest request, Long candidateId) {
        PostAdoptionReportEntity report = reportRepository.findByIdAndCandidate(id, candidateId)
                .orElseThrow(() -> new AccessDeniedException("Отчёт не найден или не принадлежит кандидату"));
        report.setReportText(request.reportText());
        report.setSubmittedDate(request.submittedDate() != null ? request.submittedDate() : LocalDate.now());
        report.setStatus(request.status() != null ? request.status() : ReportStatus.submitted);
        reportRepository.save(report);
        scheduleNext(report);
        notifyCoordinators(report.getId());
    }

    public List<ReportMediaResponse> getMedia(Long reportId, Long requesterId, boolean isCandidate) {
        if (isCandidate && (requesterId == null || reportRepository.findByIdAndCandidate(reportId, requesterId).isEmpty())) {
            throw new AccessDeniedException("Отчёт не найден или не принадлежит кандидату");
        }
        return reportMapper.toMediaResponses(reportMediaRepository.findByReportIdOrderByUploadedAtDesc(reportId));
    }

    public ReportMediaResponse uploadMedia(Long reportId, MultipartFile file, String description, Long candidateId) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Файл не найден");
        }
        PostAdoptionReportEntity report = reportRepository.findByIdAndCandidate(reportId, candidateId)
                .orElseThrow(() -> new AccessDeniedException("Отчёт не найден или не принадлежит кандидату"));
        String key = storageService.uploadReportMedia(reportId, file);
        ReportMediaEntity media = new ReportMediaEntity();
        media.setReport(report);
        media.setStorageKey(key);
        media.setDescription(description);
        return reportMapper.toMediaResponse(reportMediaRepository.save(media));
    }

    private void applyRequest(PostAdoptionReportEntity entity, PostAdoptionReportRequest request) {
        if (request.agreementId() != null) {
            entity.setAgreementId(request.agreementId());
        }
        if (request.dueDate() != null) {
            entity.setDueDate(request.dueDate());
        }
        entity.setReportText(request.reportText());
        entity.setVolunteerFeedback(request.volunteerFeedback());
        entity.setSubmittedDate(request.submittedDate());
        if (request.status() != null) {
            entity.setStatus(request.status());
        }
    }

    private void scheduleNext(PostAdoptionReportEntity submittedReport) {
        if (submittedReport.getAgreementId() == null || submittedReport.getDueDate() == null) {
            return;
        }
        boolean hasPending = reportRepository.existsByAgreementIdAndStatus(submittedReport.getAgreementId(), ReportStatus.pending.name())
                || reportRepository.existsByAgreementIdAndStatus(submittedReport.getAgreementId(), ReportStatus.overdue.name());
        if (hasPending) {
            return;
        }
        int offsetDays = Math.max(0, settingService.getReportOffsetDays());
        int fillDays = settingService.getReportFillDays();
        PostAdoptionReportEntity next = new PostAdoptionReportEntity();
        next.setAgreementId(submittedReport.getAgreementId());
        LocalDate today = LocalDate.now();
        LocalDate availableFrom = submittedReport.getDueDate().minusDays(fillDays).plusDays(offsetDays);
        if (availableFrom.isAfter(today)) {
            return;
        }
        LocalDate nextDue = submittedReport.getDueDate().plusDays(offsetDays);
        next.setDueDate(nextDue);
        next.setStatus(nextDue.isBefore(today) ? ReportStatus.overdue : ReportStatus.pending);
        reportRepository.save(next);
    }

    private void notifyCoordinators(Long reportId) {
        personRepository.findActiveByRole(com.pethaven.model.enums.SystemRole.coordinator.name())
                .forEach(person -> notificationService.push(
                        person.getId(),
                        com.pethaven.model.enums.NotificationType.report_due,
                        "Новый постадопционный отчёт",
                        "Поступил отчёт #" + reportId + " от кандидата"
                ));
    }
}
