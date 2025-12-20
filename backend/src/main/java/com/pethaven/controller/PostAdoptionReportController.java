package com.pethaven.controller;

import com.pethaven.dto.PostAdoptionReportDto;
import com.pethaven.dto.PostAdoptionReportRequest;
import com.pethaven.entity.PostAdoptionReportEntity;
import com.pethaven.model.enums.ReportStatus;
import com.pethaven.entity.ReportMediaEntity;
import com.pethaven.repository.PostAdoptionReportRepository;
import com.pethaven.repository.ReportMediaRepository;
import com.pethaven.service.ObjectStorageService;
import com.pethaven.service.SettingService;
import com.pethaven.service.NotificationService;
import com.pethaven.repository.PersonRepository;
import com.pethaven.dto.ApiMessage;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
public class PostAdoptionReportController {

    private final PostAdoptionReportRepository reportRepository;
    private final ReportMediaRepository reportMediaRepository;
    private final ObjectStorageService storageService;
    private final SettingService settingService;
    private final NotificationService notificationService;
    private final PersonRepository personRepository;

    public PostAdoptionReportController(PostAdoptionReportRepository reportRepository,
                                        ReportMediaRepository reportMediaRepository,
                                        ObjectStorageService storageService,
                                        SettingService settingService,
                                        NotificationService notificationService,
                                        PersonRepository personRepository) {
        this.reportRepository = reportRepository;
        this.reportMediaRepository = reportMediaRepository;
        this.storageService = storageService;
        this.settingService = settingService;
        this.notificationService = notificationService;
        this.personRepository = personRepository;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CANDIDATE"))) {
            if (authentication.getPrincipal() instanceof Long uid) {
                List<PostAdoptionReportDto> own = reportRepository.findDetailedByCandidate(uid)
                        .stream()
                        .map(PostAdoptionReportDto::fromProjection)
                        .toList();
                return ResponseEntity.ok(own);
            }
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(reportRepository.findAll());
    }

    @PostMapping
    public PostAdoptionReportEntity create(@Valid @RequestBody PostAdoptionReportRequest request) {
        PostAdoptionReportEntity entity = new PostAdoptionReportEntity();
        entity.setAgreementId(request.agreementId());
        entity.setDueDate(request.dueDate());
        entity.setReportText(request.reportText());
        entity.setVolunteerFeedback(request.volunteerFeedback());
        entity.setSubmittedDate(request.submittedDate());
        if (request.status() != null) {
            entity.setStatus(request.status());
        }
        return reportRepository.save(entity);
    }

    @PutMapping("/{id}")
    public PostAdoptionReportEntity update(@PathVariable Long id, @Valid @RequestBody PostAdoptionReportRequest request,
                                           Authentication authentication) {
        PostAdoptionReportEntity entity = reportRepository.findById(id).orElseThrow();
        entity.setDueDate(request.dueDate());
        entity.setReportText(request.reportText());
        entity.setVolunteerFeedback(request.volunteerFeedback());
        entity.setSubmittedDate(request.submittedDate());
        entity.setStatus(request.status() != null ? request.status() : ReportStatus.submitted);
        if (authentication != null && authentication.getPrincipal() instanceof Long uid && request.volunteerFeedback() != null) {
            entity.setCommentAuthorId(uid);
        }
        return reportRepository.save(entity);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> byId(@PathVariable Long id, Authentication authentication) {
        boolean isCandidate = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CANDIDATE"));
        if (isCandidate) {
            if (authentication.getPrincipal() instanceof Long uid) {
                return reportRepository.findByIdAndCandidate(id, uid)
                        .map(ResponseEntity::ok)
                        .orElse(ResponseEntity.status(403).build());
            }
            return ResponseEntity.status(401).build();
        }
        return reportRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiMessage> submit(@PathVariable Long id,
                                             @RequestBody PostAdoptionReportRequest request,
                                             Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long uid)) {
            return ResponseEntity.status(401).build();
        }
        return reportRepository.findByIdAndCandidate(id, uid)
                .map(report -> {
                    report.setReportText(request.reportText());
                    report.setSubmittedDate(request.submittedDate() != null ? request.submittedDate() : java.time.LocalDate.now());
                    report.setStatus(request.status() != null ? request.status() : ReportStatus.submitted);
                    reportRepository.save(report);
                    scheduleNext(report);
                    notifyCoordinators(report.getId());
                    return ResponseEntity.ok(ApiMessage.of("Отчёт отправлен"));
                })
                .orElseGet(() -> ResponseEntity.status(403).body(ApiMessage.of("Отчёт не найден или не принадлежит кандидату")));
    }

    @GetMapping("/{id}/media")
    public ResponseEntity<List<ReportMediaEntity>> media(@PathVariable Long id, Authentication authentication) {
        if (!hasAccessToReport(id, authentication)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(reportMediaRepository.findByReportIdOrderByUploadedAtDesc(id));
    }

    @PostMapping(value = "/{id}/media", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadMedia(@PathVariable Long id,
                                         @RequestParam("file") MultipartFile file,
                                         @RequestParam(required = false) String description,
                                         Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long uid)) {
            return ResponseEntity.status(401).build();
        }
        return reportRepository.findByIdAndCandidate(id, uid)
                .map(report -> {
                    if (file.isEmpty()) {
                        return ResponseEntity.badRequest().body(ApiMessage.of("Файл не найден"));
                    }
                    String key = storageService.uploadReportMedia(id, file);
                    ReportMediaEntity media = new ReportMediaEntity();
                    media.setReport(report);
                    media.setStorageKey(key);
                    media.setDescription(description);
                    ReportMediaEntity saved = reportMediaRepository.save(media);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.status(403).body(ApiMessage.of("Отчёт не найден или не принадлежит кандидату")));
    }

    private boolean hasAccessToReport(Long reportId, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long uid)) {
            return false;
        }
        boolean isCandidate = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CANDIDATE"));
        if (isCandidate) {
            return reportRepository.findByIdAndCandidate(reportId, uid).isPresent();
        }
        // coordinators/volunteers/admin can view (secured in SecurityConfig)
        return true;
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
        java.time.LocalDate baseDate = submittedReport.getDueDate() != null
                ? submittedReport.getDueDate()
                : (submittedReport.getSubmittedDate() != null ? submittedReport.getSubmittedDate() : java.time.LocalDate.now());
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
