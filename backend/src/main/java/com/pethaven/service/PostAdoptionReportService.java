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
        return reportRepository.findVisibleDetailedByCandidate(candidateId)
                .stream()
                .map(PostAdoptionReportDto::fromProjection)
                .toList();
    }

    public List<PostAdoptionReportResponse> listAll() {
        return reportMapper.toResponses(reportRepository.findAll());
    }

    public PostAdoptionReportResponse create(PostAdoptionReportRequest request) {
        PostAdoptionReportEntity entity = new PostAdoptionReportEntity();
        applyRequest(entity, request);
        return reportMapper.toResponse(reportRepository.save(entity));
    }

    public PostAdoptionReportResponse update(Long id, PostAdoptionReportRequest request, Long authorId) {
        PostAdoptionReportEntity entity = reportRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Report not found: " + id));
        applyRequest(entity, request);
        if (authorId != null && request.volunteerFeedback() != null) {
            entity.setCommentAuthorId(authorId);
        }
        return reportMapper.toResponse(reportRepository.save(entity));
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
        entity.setAgreementId(request.agreementId());
        entity.setDueDate(request.dueDate());
        entity.setReportText(request.reportText());
        entity.setVolunteerFeedback(request.volunteerFeedback());
        entity.setSubmittedDate(request.submittedDate());
        if (request.status() != null) {
            entity.setStatus(request.status());
        }
    }

    private void scheduleNext(PostAdoptionReportEntity submittedReport) {
        if (submittedReport.getAgreementId() == null) {
            return;
        }
        boolean hasPending = reportRepository.existsByAgreementIdAndStatus(submittedReport.getAgreementId(), ReportStatus.pending.name());
        if (hasPending) {
            return;
        }
        int offsetDays = settingService.getReportOffsetDays();
        int fillDays = settingService.getReportFillDays();
        int total = Math.max(1, offsetDays + fillDays);
        PostAdoptionReportEntity next = new PostAdoptionReportEntity();
        next.setAgreementId(submittedReport.getAgreementId());
        LocalDate baseDate = submittedReport.getDueDate() != null
                ? submittedReport.getDueDate()
                : (submittedReport.getSubmittedDate() != null ? submittedReport.getSubmittedDate() : LocalDate.now());
        next.setDueDate(baseDate.plusDays(total));
        next.setStatus(ReportStatus.pending);
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
