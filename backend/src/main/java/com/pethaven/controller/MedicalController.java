package com.pethaven.controller;

import com.pethaven.dto.MedicalRecordRequest;
import com.pethaven.dto.MedicalRecordResponse;
import com.pethaven.service.MedicalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/medical")
public class MedicalController {

    private final MedicalService medicalService;

    public MedicalController(MedicalService medicalService) {
        this.medicalService = medicalService;
    }

    @GetMapping("/animal/{animalId}")
    public List<MedicalRecordResponse> byAnimal(@PathVariable Long animalId) {
        return medicalService.getByAnimal(animalId);
    }

    @PostMapping
    public ResponseEntity<Void> create(@Valid @RequestBody MedicalRecordRequest record,
                                       Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long vetId)) {
            return ResponseEntity.status(401).build();
        }
        Long id = medicalService.addRecord(record, vetId);
        return ResponseEntity.created(URI.create("/api/v1/medical/" + id)).build();
    }

    @GetMapping("/upcoming")
    public List<MedicalRecordResponse> upcoming(@RequestParam(defaultValue = "30") int days) {
        return medicalService.getUpcoming(days);
    }
}
