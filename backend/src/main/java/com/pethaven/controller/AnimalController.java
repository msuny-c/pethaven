package com.pethaven.controller;

import com.pethaven.entity.AnimalEntity;
import com.pethaven.entity.AnimalMediaEntity;
import com.pethaven.dto.ApiMessage;
import com.pethaven.model.enums.AnimalStatus;
import com.pethaven.service.AnimalService;
import com.pethaven.service.ObjectStorageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
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
    public List<AnimalEntity> catalog(@RequestParam(required = false) String species,
                                      @RequestParam(required = false) AnimalStatus status) {
        return animalService.getCatalog(species, status);
    }

    @GetMapping("/species")
    public List<String> species() {
        return animalService.getAvailableSpecies();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnimalEntity> byId(@PathVariable Long id) {
        return animalService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Void> create(@Valid @RequestBody AnimalEntity animal) {
        Long id = animalService.createAnimal(animal);
        return ResponseEntity.created(URI.create("/api/v1/animals/" + id)).build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnimalEntity> update(@PathVariable Long id, @RequestBody AnimalEntity payload) {
        return ResponseEntity.ok(animalService.updateAnimal(id, payload));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiMessage> updateStatus(@PathVariable Long id,
                                                   @RequestParam AnimalStatus status,
                                                   Authentication authentication) {
        boolean isVet = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_VETERINAR"));
        if (isVet && status != AnimalStatus.quarantine) {
            return ResponseEntity.status(403).body(ApiMessage.of("Ветеринар может отправить только на карантин"));
        }
        try {
            animalService.updateStatus(id, status);
            return ResponseEntity.status(204).<ApiMessage>build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(ApiMessage.of(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        animalService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnimalMediaEntity> uploadMedia(@PathVariable Long id,
                                                         @RequestParam("file") MultipartFile file,
                                                         @RequestParam(required = false) String description) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        String storageKey = storageService.uploadAnimalMedia(id, file);
        AnimalMediaEntity saved = animalService.addMedia(id, storageKey, description);
        return ResponseEntity.ok(saved);
    }

    @PostMapping(value = "/{id}/media", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AnimalMediaEntity> addMedia(@PathVariable Long id, @RequestBody AnimalMediaEntity media) {
        AnimalMediaEntity saved = animalService.addMedia(id, media);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}/media")
    public List<AnimalMediaEntity> media(@PathVariable Long id) {
        return animalService.getMedia(id);
    }
}
