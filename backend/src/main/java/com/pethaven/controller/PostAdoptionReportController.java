package com.pethaven.controller;

import com.pethaven.dto.ApiMessage;
import com.pethaven.dto.PostAdoptionReportDto;
import com.pethaven.dto.PostAdoptionReportRequest;
import com.pethaven.dto.PostAdoptionReportResponse;
import com.pethaven.dto.ReportMediaResponse;
import com.pethaven.service.PostAdoptionReportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
public class PostAdoptionReportController {

    private final PostAdoptionReportService reportService;

    public PostAdoptionReportController(PostAdoptionReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CANDIDATE"))) {
            if (authentication.getPrincipal() instanceof Long uid) {
                List<PostAdoptionReportDto> own = reportService.listForCandidate(uid);
                return ResponseEntity.ok(own);
            }
            return ResponseEntity.status(401).build();
        }
        List<PostAdoptionReportResponse> all = reportService.listAll();
        return ResponseEntity.ok(all);
    }

    @PostMapping
    public PostAdoptionReportResponse create(@Valid @RequestBody PostAdoptionReportRequest request) {
        return reportService.create(request);
    }

    @PutMapping("/{id}")
    public PostAdoptionReportResponse update(@PathVariable Long id, @Valid @RequestBody PostAdoptionReportRequest request,
                                             Authentication authentication) {
        Long authorId = authentication != null && authentication.getPrincipal() instanceof Long uid ? uid : null;
        return reportService.update(id, request, authorId);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiMessage> submit(@PathVariable Long id,
                                             @Valid @RequestBody PostAdoptionReportRequest request,
                                             Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long uid)) {
            return ResponseEntity.status(401).build();
        }
        reportService.submit(id, request, uid);
        return ResponseEntity.ok(ApiMessage.of("Отчёт отправлен"));
    }

    @GetMapping("/{id}/media")
    public ResponseEntity<List<ReportMediaResponse>> media(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long requesterId)) {
            return ResponseEntity.status(401).build();
        }
        boolean isCandidate = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CANDIDATE"));
        return ResponseEntity.ok(reportService.getMedia(id, requesterId, isCandidate));
    }

    @PostMapping(value = "/{id}/media", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReportMediaResponse> uploadMedia(@PathVariable Long id,
                                                           @RequestParam("file") MultipartFile file,
                                                           @RequestParam(required = false) String description,
                                                           Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long uid)) {
            return ResponseEntity.status(401).build();
        }
        ReportMediaResponse saved = reportService.uploadMedia(id, file, description, uid);
        return ResponseEntity.ok(saved);
    }
}
