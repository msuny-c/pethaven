package com.pethaven.controller;

import com.pethaven.dto.ApiMessage;
import com.pethaven.dto.VolunteerApplicationRequest;
import com.pethaven.dto.VolunteerDecisionRequest;
import com.pethaven.entity.VolunteerApplicationEntity;
import com.pethaven.service.VolunteerApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/volunteers")
public class VolunteerController {

    private final VolunteerApplicationService applicationService;

    public VolunteerController(VolunteerApplicationService applicationService) {
        this.applicationService = applicationService;
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
    public List<VolunteerApplicationEntity> listApplications(Authentication authentication) {
        Long uid = null;
        if (authentication != null && authentication.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR") || a.getAuthority().equals("ROLE_ADMIN"))) {
            if (authentication.getPrincipal() instanceof Long authId) {
                uid = authId;
            }
        }
        return applicationService.list(uid);
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<?> getApplication(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR") || a.getAuthority().equals("ROLE_ADMIN"));
        Long uid = null;
        if (!isAdmin && authentication != null && authentication.getPrincipal() instanceof Long authId) {
            uid = authId;
        }
        var opt = applicationService.getOne(id, uid);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiMessage.of("Анкета не найдена"));
        }
        return ResponseEntity.ok(opt.get());
    }

    @PatchMapping("/applications/decision")
    public ResponseEntity<ApiMessage> decide(@Valid @RequestBody VolunteerDecisionRequest request) {
        applicationService.decide(request);
        return ResponseEntity.ok(ApiMessage.of("Статус заявки волонтёра обновлён"));
    }
}
