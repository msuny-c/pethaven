package com.pethaven.controller;

import com.pethaven.dto.AnimalCreateRequest;
import com.pethaven.dto.AnimalMediaResponse;
import com.pethaven.dto.AnimalMedicalUpdateRequest;
import com.pethaven.dto.AnimalNoteResponse;
import com.pethaven.dto.AnimalResponse;
import com.pethaven.dto.AnimalStatusUpdateRequest;
import com.pethaven.dto.AnimalUpdateRequest;
import com.pethaven.dto.ApiMessage;
import com.pethaven.model.enums.AnimalStatus;
import com.pethaven.service.AnimalService;
import com.pethaven.service.ObjectStorageService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/animals")
public class AnimalController {

    private final AnimalService animalService;
    private final ObjectStorageService storageService;

    public AnimalController(AnimalService animalService, ObjectStorageService storageService) {
        this.animalService = animalService;
        this.storageService = storageService;
    }

    @GetMapping
    public List<AnimalResponse> catalog(@RequestParam(required = false) String species,
                                        @RequestParam(required = false) AnimalStatus status,
                                        Authentication authentication) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isCoordinator = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR"));
        boolean includePending = isAdmin || isCoordinator;
        return animalService.getCatalog(species, status, includePending);
    }

    @GetMapping("/species")
    public List<String> species() {
        return animalService.getAvailableSpecies();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnimalResponse> byId(@PathVariable Long id) {
        return animalService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Void> create(@Valid @RequestBody AnimalCreateRequest request, Authentication authentication) {
        boolean isCoordinator = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR"));
        try {
            Long id = animalService.createAnimal(request, isCoordinator);
            return ResponseEntity.created(URI.create("/api/v1/animals/" + id)).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnimalResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody AnimalUpdateRequest payload,
                                                 Authentication authentication) {
        boolean isCoordinator = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_COORDINATOR"));
        try {
            return ResponseEntity.ok(animalService.updateAnimal(id, payload, isCoordinator));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiMessage> updateStatus(@PathVariable Long id,
                                                   @Valid @RequestBody AnimalStatusUpdateRequest request,
                                                   Authentication authentication) {
        boolean isVet = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_VETERINAR"));
        AnimalStatus status = request.status();
        if (isVet && status != AnimalStatus.quarantine && status != AnimalStatus.available) {
            return ResponseEntity.status(403).body(ApiMessage.of("Ветеринар может менять статус только между карантином и доступен"));
        }
        if (status == AnimalStatus.pending_review) {
            return ResponseEntity.badRequest().body(ApiMessage.of("Статус 'на проверке' устанавливается автоматически"));
        }
        try {
            animalService.updateStatus(id, status, false);
            return ResponseEntity.status(204).<ApiMessage>build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(ApiMessage.of(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiMessage.of(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/review")
    public ResponseEntity<ApiMessage> review(@PathVariable Long id,
                                             @RequestParam boolean approved,
                                             Authentication authentication) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            return ResponseEntity.status(403).body(ApiMessage.of("Только администратор может утверждать карточки"));
        }
        try {
            animalService.reviewAnimal(id, approved);
            return ResponseEntity.ok(ApiMessage.of(approved ? "Карточка утверждена" : "Карточка отправлена на доработку, статус переключен в карантин"));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        animalService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnimalMediaResponse> uploadMedia(@PathVariable Long id,
                                                           @RequestParam("file") MultipartFile file,
                                                           @RequestParam(required = false) String description) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        String storageKey = storageService.uploadAnimalMedia(id, file);
        AnimalMediaResponse saved = animalService.addMedia(id, storageKey, description);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<ApiMessage> addBehaviorNote(@PathVariable Long id,
                                                      @RequestParam String note,
                                                      Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long authorId)) {
            return ResponseEntity.status(401).body(ApiMessage.of("Требуется авторизация"));
        }
        try {
            animalService.addBehaviorNote(id, note, authorId);
            return ResponseEntity.ok(ApiMessage.of("Заметка добавлена"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiMessage.of(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/medical")
    public ResponseEntity<AnimalResponse> updateMedical(@PathVariable Long id,
                                                        @Valid @RequestBody AnimalMedicalUpdateRequest payload) {
        AnimalResponse updated = animalService.updateMedical(id, payload);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}/media")
    public List<AnimalMediaResponse> media(@PathVariable Long id) {
        return animalService.getMedia(id);
    }

    @GetMapping("/{id}/notes")
    public List<AnimalNoteResponse> notes(@PathVariable Long id) {
        return animalService.getNotes(id);
    }
}
