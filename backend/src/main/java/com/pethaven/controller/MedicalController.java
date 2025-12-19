package com.pethaven.controller;

import com.pethaven.entity.MedicalRecordEntity;
import com.pethaven.service.MedicalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public List<MedicalRecordEntity> byAnimal(@PathVariable Long animalId) {
        return medicalService.getByAnimal(animalId);
    }

    @PostMapping
    public ResponseEntity<Void> create(@Valid @RequestBody MedicalRecordEntity record) {
        if (record.getProcedure() == null) {
            return ResponseEntity.badRequest().build();
        }
        Long id = medicalService.addRecord(record);
        return ResponseEntity.created(URI.create("/api/v1/medical/" + id)).build();
    }

    @GetMapping("/upcoming")
    public List<MedicalRecordEntity> upcoming(@RequestParam(defaultValue = "30") int days) {
        return medicalService.getUpcoming(days);
    }
}
