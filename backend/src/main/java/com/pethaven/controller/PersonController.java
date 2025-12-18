package com.pethaven.controller;

import com.pethaven.entity.PersonEntity;
import com.pethaven.service.PersonService;
import com.pethaven.dto.UpdateRolesRequest;
import com.pethaven.dto.UserStatusRequest;
import com.pethaven.dto.ApiMessage;
import com.pethaven.dto.SelfDeactivateRequest;
import com.pethaven.dto.SelfProfileUpdateRequest;
import com.pethaven.dto.UserCreateRequest;
import com.pethaven.service.ObjectStorageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class PersonController {

    private final PersonService personService;
    private final ObjectStorageService storageService;

    public PersonController(PersonService personService, ObjectStorageService storageService) {
        this.personService = personService;
        this.storageService = storageService;
    }

    @GetMapping
    public List<PersonEntity> getAll() {
        return personService.findAll();
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody UserCreateRequest request) {
        try {
            PersonEntity created = personService.createUser(
                    request.email(),
                    request.password(),
                    request.firstName(),
                    request.lastName(),
                    request.phoneNumber(),
                    request.roles()
            );
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiMessage.of(e.getMessage()));
        }
    }

    @PatchMapping("/roles")
    public ResponseEntity<PersonEntity> updateRoles(@Valid @RequestBody UpdateRolesRequest request,
                                                    Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof Long uid && uid.equals(request.personId())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(personService.updateRoles(request.personId(), request.roles()));
    }

    @PatchMapping("/status")
    public ResponseEntity<PersonEntity> updateStatus(@Valid @RequestBody UserStatusRequest request) {
        return ResponseEntity.ok(personService.updateActive(request.personId(), request.active()));
    }

    @DeleteMapping
    public ResponseEntity<ApiMessage> delete(@Valid @RequestBody UserStatusRequest request,
                                             Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof Long uid && uid.equals(request.personId())) {
            return ResponseEntity.status(403).body(ApiMessage.of("Нельзя удалить собственную учетную запись"));
        }
        personService.delete(request.personId());
        return ResponseEntity.ok(ApiMessage.of("Пользователь удалён"));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiMessage> deleteSelf(@Valid @RequestBody SelfDeactivateRequest request,
                                                 Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long uid)) {
            return ResponseEntity.status(401).build();
        }
        boolean ok = personService.deactivateSelf(uid, request.password());
        if (!ok) {
            return ResponseEntity.status(403).body(ApiMessage.of("Неверный пароль"));
        }
        return ResponseEntity.ok(ApiMessage.of("Учётная запись деактивирована"));
    }

    @PostMapping("/avatar")
    public ResponseEntity<PersonEntity> uploadAvatar(@org.springframework.web.bind.annotation.RequestParam("file") MultipartFile file,
                                                     Authentication authentication) throws IOException {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long uid)) {
            return ResponseEntity.status(401).build();
        }
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        String key = storageService.uploadAvatar(uid, file);
        PersonEntity updated = personService.updateAvatar(uid, key);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/me/profile")
    public ResponseEntity<PersonEntity> updateProfile(@Valid @RequestBody SelfProfileUpdateRequest request,
                                                      Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long uid)) {
            return ResponseEntity.status(401).build();
        }
        PersonEntity updated = personService.updateProfile(uid, request.firstName(), request.lastName(), request.phoneNumber());
        return ResponseEntity.ok(updated);
    }
}
