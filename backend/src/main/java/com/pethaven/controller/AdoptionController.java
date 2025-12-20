package com.pethaven.controller;

import com.pethaven.dto.AdoptionDecisionRequest;
import com.pethaven.dto.AgreementRequest;
import com.pethaven.dto.ApiMessage;
import com.pethaven.dto.ApplicationCancelRequest;
import com.pethaven.dto.ApplicationRequest;
import com.pethaven.dto.InterviewScheduleRequest;
import com.pethaven.dto.InterviewUpdateRequest;
import com.pethaven.dto.InterviewSlotRequest;
import com.pethaven.dto.InterviewSlotBookRequest;
import com.pethaven.dto.InterviewSlotCancelRequest;
import com.pethaven.dto.InterviewRescheduleRequest;
import com.pethaven.entity.AdoptionApplicationEntity;
import com.pethaven.entity.AgreementEntity;
import com.pethaven.entity.InterviewEntity;
import com.pethaven.entity.InterviewSlotEntity;
import com.pethaven.model.enums.ApplicationStatus;
import com.pethaven.model.enums.InterviewSlotStatus;
import com.pethaven.service.AdoptionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/adoptions")
public class AdoptionController {

    private final AdoptionService adoptionService;

    public AdoptionController(AdoptionService adoptionService) {
        this.adoptionService = adoptionService;
    }

    @PostMapping("/applications")
    public ResponseEntity<?> submit(@Valid @RequestBody ApplicationRequest request,
                                    org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long candidateId)) {
            return ResponseEntity.status(401).build();
        }
        Long id = adoptionService.submitApplication(request, candidateId);
        return ResponseEntity.created(URI.create("/api/v1/adoptions/applications/" + id))
                .body(ApiMessage.of("Заявка отправлена"));
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
    public List<AdoptionApplicationEntity> list(@RequestParam(required = false) ApplicationStatus status,
                                                Authentication authentication) {
        Long candidateId = null;
        if (authentication != null && authentication.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR") || a.getAuthority().equals("ROLE_ADMIN"))) {
            // для кандидатов показываем только их заявки
            if (authentication.getPrincipal() instanceof Long uid) {
                candidateId = uid;
            }
        }
        return adoptionService.getApplications(status, candidateId);
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<AdoptionApplicationEntity> getById(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).<AdoptionApplicationEntity>body(null);
        }
        boolean isCoordinatorOrAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR") || a.getAuthority().equals("ROLE_ADMIN"));
        Long uid = authentication != null && authentication.getPrincipal() instanceof Long pid ? pid : null;
        return adoptionService.getApplication(id)
                .map(app -> {
                    if (!isCoordinatorOrAdmin && (uid == null || !uid.equals(app.getCandidateId()))) {
                        return ResponseEntity.status(403).<AdoptionApplicationEntity>body(null);
                    }
                    return ResponseEntity.ok(app);
                })
                .orElseGet(() -> ResponseEntity.status(404).<AdoptionApplicationEntity>body(null));
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

    @GetMapping("/applications/{id}/interviews")
    public List<InterviewEntity> byApplication(@PathVariable Long id) {
        return adoptionService.getInterviewsByApplication(id);
    }

    @GetMapping("/interviews")
    public List<InterviewEntity> allInterviews() {
        return adoptionService.getAllInterviews();
    }

    @GetMapping("/slots")
    public List<InterviewSlotEntity> slots(@RequestParam(required = false) InterviewSlotStatus status,
                                           @RequestParam(required = false) Long interviewerId) {
        return adoptionService.getSlots(status, interviewerId);
    }

    @PostMapping("/slots")
    public InterviewSlotEntity createSlot(@Valid @RequestBody InterviewSlotRequest request) {
        return adoptionService.createSlot(request);
    }

    @DeleteMapping("/slots/{id}")
    public ResponseEntity<Void> cancelSlot(@PathVariable Long id) {
        adoptionService.cancelSlot(id);
        return ResponseEntity.noContent().build();
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
    public ResponseEntity<ApiMessage> complete(@Valid @RequestBody AgreementRequest request) {
        try {
            Long agreementId = adoptionService.completeAdoption(request);
            return ResponseEntity.created(URI.create("/api/v1/adoptions/agreements/" + agreementId))
                    .body(ApiMessage.of("Передача оформлена"));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(403).body(ApiMessage.of(e.getMessage()));
        }
    }

    @GetMapping("/agreements/{id}")
    public ResponseEntity<AgreementEntity> getAgreement(@PathVariable Long id) {
        return adoptionService.getAgreement(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/agreements")
    public List<AgreementEntity> listAgreements() {
        return adoptionService.getAgreements();
    }
}
