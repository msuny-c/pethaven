package com.pethaven.controller;

import com.pethaven.dto.ApiMessage;
import com.pethaven.dto.OrientationRequest;
import com.pethaven.dto.OrientationApprovalRequest;
import com.pethaven.dto.VolunteerApplicationRequest;
import com.pethaven.dto.VolunteerDecisionRequest;
import com.pethaven.entity.VolunteerMentorEntity;
import com.pethaven.entity.VolunteerApplicationEntity;
import com.pethaven.model.enums.VolunteerApplicationStatus;
import com.pethaven.service.VolunteerService;
import com.pethaven.service.VolunteerApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/volunteers")
public class VolunteerController {

    private final VolunteerService volunteerService;
    private final VolunteerApplicationService applicationService;

    public VolunteerController(VolunteerService volunteerService, VolunteerApplicationService applicationService) {
        this.volunteerService = volunteerService;
        this.applicationService = applicationService;
    }

    @GetMapping("/orientation")
    public List<VolunteerMentorEntity> listAssignments() {
        return volunteerService.getAssignments();
    }

    @PostMapping("/orientation")
    public ResponseEntity<ApiMessage> assignOrientation(@Valid @RequestBody OrientationRequest request) {
        volunteerService.assignOrientation(request);
        return ResponseEntity.ok(ApiMessage.of("Ориентация назначена"));
    }

    @PatchMapping("/orientation/approve")
    public ResponseEntity<ApiMessage> approveOrientation(@Valid @RequestBody OrientationApprovalRequest request) {
        volunteerService.approveOrientation(request);
        return ResponseEntity.ok(ApiMessage.of("Наставник подтвердил стажировку"));
    }

    @PostMapping("/applications")
    public ResponseEntity<ApiMessage> submitApplication(@Valid @RequestBody VolunteerApplicationRequest request,
                                                        Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long uid)) {
            return ResponseEntity.status(401).body(ApiMessage.of("Требуется авторизация"));
        }
        applicationService.submit(request, uid);
        return ResponseEntity.ok(ApiMessage.of("Заявка волонтёра отправлена"));
    }

    @GetMapping("/applications")
    public List<VolunteerApplicationEntity> listApplications(@org.springframework.web.bind.annotation.RequestParam(required = false) VolunteerApplicationStatus status,
                                                             Authentication authentication) {
        Long uid = null;
        if (authentication != null && authentication.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR") || a.getAuthority().equals("ROLE_ADMIN"))) {
            if (authentication.getPrincipal() instanceof Long authId) {
                uid = authId;
            }
        }
        return applicationService.list(status, uid);
    }

    @PatchMapping("/applications/decision")
    public ResponseEntity<ApiMessage> decide(@Valid @RequestBody VolunteerDecisionRequest request) {
        applicationService.decide(request);
        return ResponseEntity.ok(ApiMessage.of("Статус заявки волонтёра обновлён"));
    }
}
