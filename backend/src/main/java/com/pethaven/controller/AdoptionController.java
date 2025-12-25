package com.pethaven.controller;

import com.pethaven.dto.AdoptionApplicationResponse;
import com.pethaven.dto.AdoptionDecisionRequest;
import com.pethaven.dto.AgreementRequest;
import com.pethaven.dto.AgreementResponse;
import com.pethaven.dto.AgreementConfirmRequest;
import com.pethaven.dto.ApiMessage;
import com.pethaven.dto.ApplicationCancelRequest;
import com.pethaven.dto.ApplicationRequest;
import com.pethaven.dto.InterviewResponse;
import com.pethaven.dto.InterviewScheduleRequest;
import com.pethaven.dto.InterviewUpdateRequest;
import com.pethaven.dto.InterviewSlotBookRequest;
import com.pethaven.dto.InterviewSlotCancelRequest;
import com.pethaven.dto.InterviewRescheduleRequest;
import com.pethaven.mapper.AdoptionMapper;
import com.pethaven.model.enums.ApplicationStatus;
import com.pethaven.service.AdoptionService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/adoptions")
public class AdoptionController {

    private final AdoptionService adoptionService;
    private final AdoptionMapper adoptionMapper;

    public AdoptionController(AdoptionService adoptionService, AdoptionMapper adoptionMapper) {
        this.adoptionService = adoptionService;
        this.adoptionMapper = adoptionMapper;
    }

    @PostMapping(value = "/applications", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submit(@Valid @ModelAttribute ApplicationRequest request,
                                    @RequestPart("passport") MultipartFile passport,
                                    org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long candidateId)) {
            return ResponseEntity.status(401).build();
        }
        try {
            Long id = adoptionService.submitApplication(request, passport, candidateId);
            return ResponseEntity.created(URI.create("/api/v1/adoptions/applications/" + id))
                    .body(ApiMessage.of("Заявка отправлена"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiMessage.of(e.getMessage()));
        }
    }

    @PostMapping(value = "/applications/{id}/passport", consumes = {"multipart/form-data"})
    public ResponseEntity<?> uploadPassport(@PathVariable Long id,
                                            @RequestPart("file") MultipartFile file,
                                            Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long candidateId)) {
            return ResponseEntity.status(401).build();
        }
        try {
            String key = adoptionService.attachPassport(id, candidateId, file);
            return ResponseEntity.ok(ApiMessage.of("Документ загружен: " + key));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiMessage.of(e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(ApiMessage.of(e.getMessage()));
        }
    }

    @GetMapping("/applications/{id}/passport")
    public ResponseEntity<byte[]> downloadPassport(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        boolean isCoordinatorOrAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR") || a.getAuthority().equals("ROLE_ADMIN"));
        Long uid = authentication.getPrincipal() instanceof Long pid ? pid : null;
        try {
            var app = adoptionService.getApplication(id).orElseThrow(() -> new IllegalArgumentException("Заявка не найдена"));
            if (!isCoordinatorOrAdmin && (uid == null || !uid.equals(app.getCandidateId()))) {
                return ResponseEntity.status(403).build();
            }
            var file = adoptionService.downloadPassport(id);
            return ResponseEntity.ok()
                    .header("Content-Type", file.contentType())
                    .header("Content-Disposition", "attachment; filename=\"passport-" + id + "\"")
                    .body(file.bytes());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/applications/cancel")
    public ResponseEntity<ApiMessage> cancel(@Valid @RequestBody ApplicationCancelRequest request,
                                             Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long candidateId)) {
            return ResponseEntity.status(401).build();
        }
        try {
            adoptionService.cancelByCandidate(request.applicationId(), candidateId, request.reason());
            return ResponseEntity.ok(ApiMessage.of("Заявка отменена"));
        } catch (IllegalArgumentException | org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(ApiMessage.of(e.getMessage()));
        }
    }

    @GetMapping("/applications")
    public List<AdoptionApplicationResponse> list(@RequestParam(required = false) ApplicationStatus status,
                                                  Authentication authentication) {
        Long candidateId = null;
        if (authentication != null && authentication.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR") || a.getAuthority().equals("ROLE_ADMIN"))) {
            if (authentication.getPrincipal() instanceof Long uid) {
                candidateId = uid;
            }
        }
        return adoptionMapper.toApplicationResponses(adoptionService.getApplications(status, candidateId));
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<AdoptionApplicationResponse> getById(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).<AdoptionApplicationResponse>body(null);
        }
        boolean isCoordinatorOrAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR") || a.getAuthority().equals("ROLE_ADMIN"));
        Long uid = authentication != null && authentication.getPrincipal() instanceof Long pid ? pid : null;
        return adoptionService.getApplication(id)
                .map(app -> {
                    if (!isCoordinatorOrAdmin && (uid == null || !uid.equals(app.getCandidateId()))) {
                        return ResponseEntity.status(403).<AdoptionApplicationResponse>body(null);
                    }
                    return ResponseEntity.ok(adoptionMapper.toApplicationResponse(app));
                })
                .orElseGet(() -> ResponseEntity.status(404).<AdoptionApplicationResponse>body(null));
    }

    @PatchMapping("/applications/status")
    public ResponseEntity<ApiMessage> decide(@Valid @RequestBody AdoptionDecisionRequest request,
                                             Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long actorId)) {
            return ResponseEntity.status(401).build();
        }
        adoptionService.updateStatus(request, actorId);
        return ResponseEntity.ok(ApiMessage.of("Статус заявки обновлен"));
    }

    @PostMapping("/interviews")
    public ResponseEntity<ApiMessage> schedule(@Valid @RequestBody InterviewScheduleRequest request,
                                               Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long coordinatorId)) {
            return ResponseEntity.status(401).build();
        }
        try {
            adoptionService.scheduleInterview(request.applicationId(), coordinatorId, request.scheduledAt());
            return ResponseEntity.ok(ApiMessage.of("Интервью назначено"));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiMessage.of(e.getMessage()));
        }
    }

    @PostMapping("/interviews/{id}/confirm")
    public ResponseEntity<ApiMessage> confirmInterview(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long uid)) {
            return ResponseEntity.status(401).build();
        }
        try {
            adoptionService.confirmInterview(id, uid);
            return ResponseEntity.ok(ApiMessage.of("Интервью подтверждено"));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(ApiMessage.of(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiMessage.of(e.getMessage()));
        }
    }

    @PostMapping("/interviews/{id}/decline")
    public ResponseEntity<ApiMessage> declineInterview(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long uid)) {
            return ResponseEntity.status(401).build();
        }
        try {
            adoptionService.declineInterview(id, uid);
            return ResponseEntity.ok(ApiMessage.of("Интервью отклонено кандидатом"));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(ApiMessage.of(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiMessage.of(e.getMessage()));
        }
    }

    @GetMapping("/applications/{id}/interviews")
    public List<InterviewResponse> byApplication(@PathVariable Long id) {
        return adoptionMapper.toInterviewResponses(adoptionService.getInterviewsByApplication(id));
    }

    @GetMapping("/interviews")
    public List<InterviewResponse> allInterviews() {
        return adoptionMapper.toInterviewResponses(adoptionService.getAllInterviews());
    }

    @PostMapping("/slots/book")
    public ResponseEntity<ApiMessage> bookSlot(@Valid @RequestBody InterviewSlotBookRequest request,
                                               Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        Long candidateId = authentication.getPrincipal() instanceof Long uid ? uid : null;
        adoptionService.bookSlot(request, candidateId);
        return ResponseEntity.ok(ApiMessage.of("Слот забронирован, интервью создано"));
    }

    @PostMapping("/slots/cancel")
    public ResponseEntity<ApiMessage> cancelSlot(@Valid @RequestBody InterviewSlotCancelRequest request,
                                                 Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        Long uid = authentication.getPrincipal() instanceof Long id ? id : null;
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        adoptionService.cancelSlot(request, uid, isAdmin);
        return ResponseEntity.ok(ApiMessage.of("Бронирование слота отменено"));
    }

    @PostMapping("/slots/reschedule")
    public ResponseEntity<ApiMessage> reschedule(@Valid @RequestBody InterviewRescheduleRequest request,
                                                 Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        Long uid = authentication.getPrincipal() instanceof Long id ? id : null;
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        adoptionService.reschedule(request, uid, isAdmin);
        return ResponseEntity.ok(ApiMessage.of("Интервью перенесено на новый слот"));
    }

    @PatchMapping("/interviews")
    public ResponseEntity<ApiMessage> updateInterview(@Valid @RequestBody InterviewUpdateRequest request,
                                                      Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long uid)) {
            return ResponseEntity.status(401).build();
        }
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        adoptionService.updateInterview(request, uid, isAdmin);
        return ResponseEntity.ok(ApiMessage.of("Интервью обновлено"));
    }

    @PostMapping("/agreements")
    public ResponseEntity<?> createAgreement(@Valid @RequestBody AgreementRequest request, Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            AgreementResponse response = adoptionService.enrichAgreement(
                    adoptionMapper.toAgreementResponse(adoptionService.createAgreement(request)));
            return ResponseEntity.created(URI.create("/api/v1/adoptions/agreements/" + response.id()))
                    .body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiMessage.of(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiMessage.of(e.getMessage()));
        }
    }

    @GetMapping("/agreements/{id}")
    public ResponseEntity<AgreementResponse> getAgreement(@PathVariable Long id) {
        return adoptionService.getAgreement(id)
                .map(adoptionMapper::toAgreementResponse)
                .map(adoptionService::enrichAgreement)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/agreements")
    public List<AgreementResponse> listAgreements() {
        return adoptionService.enrichAgreements(
                adoptionMapper.toAgreementResponses(adoptionService.getAgreements()));
    }

    @GetMapping("/agreements/{id}/template")
    public ResponseEntity<byte[]> downloadAgreementTemplate(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        Long uid = authentication.getPrincipal() instanceof Long pid ? pid : null;
        boolean isCoordinatorOrAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR") || a.getAuthority().equals("ROLE_ADMIN"));
        var agreementOpt = adoptionService.getAgreement(id);
        if (agreementOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        var agreement = agreementOpt.get();
        var appOpt = adoptionService.getApplication(agreement.getApplicationId());
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        if (!isCoordinatorOrAdmin && (uid == null || !uid.equals(appOpt.get().getCandidateId()))) {
            return ResponseEntity.status(403).build();
        }
        try {
            var file = adoptionService.downloadAgreementFile(id, false);
            return ResponseEntity.ok()
                    .header("Content-Type", file.contentType())
                    .header("Content-Disposition", "attachment; filename=\"agreement-template-" + id + ".docx\"")
                    .body(file.bytes());
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/agreements/{id}/signed")
    public ResponseEntity<byte[]> downloadSignedAgreement(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        Long uid = authentication.getPrincipal() instanceof Long pid ? pid : null;
        boolean isCoordinatorOrAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR") || a.getAuthority().equals("ROLE_ADMIN"));
        var agreementOpt = adoptionService.getAgreement(id);
        if (agreementOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        var agreement = agreementOpt.get();
        var appOpt = adoptionService.getApplication(agreement.getApplicationId());
        if (appOpt.isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        if (!isCoordinatorOrAdmin && (uid == null || !uid.equals(appOpt.get().getCandidateId()))) {
            return ResponseEntity.status(403).build();
        }
        try {
            var file = adoptionService.downloadAgreementFile(id, true);
            return ResponseEntity.ok()
                    .header("Content-Type", file.contentType())
                    .header("Content-Disposition", "attachment; filename=\"agreement-signed-" + id + ".docx\"")
                    .body(file.bytes());
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping(value = "/agreements/{id}/signed", consumes = {"multipart/form-data"})
    public ResponseEntity<?> uploadSignedAgreement(@PathVariable Long id,
                                                   @RequestPart("file") MultipartFile file,
                                                   Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long candidateId)) {
            return ResponseEntity.status(401).build();
        }
        try {
            AgreementResponse response = adoptionService.enrichAgreement(
                    adoptionMapper.toAgreementResponse(
                            adoptionService.uploadSignedAgreement(id, candidateId, file)));
            return ResponseEntity.ok(response);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(ApiMessage.of(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiMessage.of(e.getMessage()));
        }
    }

    @PostMapping("/agreements/{id}/confirm")
    public ResponseEntity<?> confirmAgreement(@PathVariable Long id,
                                              @Valid @RequestBody AgreementConfirmRequest request,
                                              Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }
        boolean canApprove = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR") || a.getAuthority().equals("ROLE_ADMIN"));
        if (!canApprove) {
            return ResponseEntity.status(403).body(ApiMessage.of("Нет прав на подтверждение договора"));
        }
        Long coordinatorId = authentication.getPrincipal() instanceof Long pid ? pid : null;
        try {
            AgreementResponse response = adoptionService.enrichAgreement(
                    adoptionMapper.toAgreementResponse(
                            adoptionService.confirmAgreement(id, coordinatorId, request)));
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiMessage.of(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiMessage.of(e.getMessage()));
        }
    }
}
