package com.pethaven.controller;

import com.pethaven.dto.ApiMessage;
import com.pethaven.dto.ShiftCreateRequest;
import com.pethaven.dto.ShiftResponse;
import com.pethaven.dto.ShiftSignupRequest;
import com.pethaven.dto.TaskShiftAssignmentRequest;
import com.pethaven.entity.ShiftVolunteerEntity;
import com.pethaven.entity.TaskShiftEntity;
import com.pethaven.service.ShiftService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/shifts")
public class ShiftController {

    private final ShiftService shiftService;

    public ShiftController(ShiftService shiftService) {
        this.shiftService = shiftService;
    }

    @GetMapping
    public List<ShiftResponse> list(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from) {
        return shiftService.getUpcoming(from == null ? LocalDate.now() : from);
    }

    @PostMapping
    public ResponseEntity<ShiftResponse> create(@Valid @RequestBody ShiftCreateRequest shift) {
        ShiftResponse saved = shiftService.createShift(shift);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiMessage> signup(@Valid @RequestBody ShiftSignupRequest request,
                                             Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long volunteerId)) {
            return ResponseEntity.status(401).body(ApiMessage.of("Требуется авторизация волонтера"));
        }
        try {
            shiftService.signup(request.shiftId(), volunteerId);
            return ResponseEntity.ok(ApiMessage.of("Волонтёр записан на смену"));
        } catch (IllegalStateException e) {
            String msg = e.getMessage() == null ? "Невозможно записаться на смену" : e.getMessage();
            if (msg.contains("уже записаны")) {
                return ResponseEntity.status(409).body(ApiMessage.of(msg));
            }
            if (msg.contains("только волонтёр")) {
                return ResponseEntity.status(403).body(ApiMessage.of(msg));
            }
            if (msg.contains("Смена не найдена")) {
                return ResponseEntity.status(404).body(ApiMessage.of(msg));
            }
            return ResponseEntity.badRequest().body(ApiMessage.of(msg));
        }
    }

    @GetMapping("/{shiftId}/volunteers")
    public List<ShiftVolunteerEntity> volunteers(@PathVariable Long shiftId) {
        return shiftService.getVolunteers(shiftId);
    }

    @GetMapping("/{shiftId}/tasks")
    public List<TaskShiftEntity> tasks(@PathVariable Long shiftId) {
        return shiftService.getShiftTasks(shiftId);
    }

    @PostMapping("/tasks/assign")
    public ResponseEntity<TaskShiftEntity> assignTask(@Valid @RequestBody TaskShiftAssignmentRequest request) {
        TaskShiftEntity saved = shiftService.assignTask(request);
        return ResponseEntity.ok(saved);
    }
}
