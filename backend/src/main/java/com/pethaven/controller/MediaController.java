package com.pethaven.controller;

import com.pethaven.entity.AnimalMediaEntity;
import com.pethaven.entity.ReportMediaEntity;
import com.pethaven.repository.AnimalMediaRepository;
import com.pethaven.repository.PersonRepository;
import com.pethaven.repository.ReportMediaRepository;
import com.pethaven.service.ObjectStorageService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

    private final AnimalMediaRepository animalMediaRepository;
    private final PersonRepository personRepository;
    private final ReportMediaRepository reportMediaRepository;
    private final ObjectStorageService storageService;

    public MediaController(AnimalMediaRepository animalMediaRepository,
                           PersonRepository personRepository,
                           ReportMediaRepository reportMediaRepository,
                           ObjectStorageService storageService) {
        this.animalMediaRepository = animalMediaRepository;
        this.personRepository = personRepository;
        this.reportMediaRepository = reportMediaRepository;
        this.storageService = storageService;
    }

    @GetMapping("/animals/{mediaId}")
    public ResponseEntity<byte[]> animalMedia(@PathVariable Long mediaId) {
        AnimalMediaEntity media = animalMediaRepository.findById(mediaId).orElse(null);
        if (media == null || media.getStorageKey() == null) {
            return ResponseEntity.notFound().build();
        }
        return fileResponse(media.getStorageKey());
    }

    @GetMapping("/avatars/{personId}")
    public ResponseEntity<byte[]> avatar(@PathVariable Long personId) {
        return personRepository.findById(personId)
                .filter(p -> p.getAvatarKey() != null)
                .map(p -> fileResponse(p.getAvatarKey()))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/reports/{mediaId}")
    public ResponseEntity<byte[]> reportMedia(@PathVariable Long mediaId) {
        ReportMediaEntity media = reportMediaRepository.findById(mediaId).orElse(null);
        if (media == null || media.getStorageKey() == null) {
            return ResponseEntity.notFound().build();
        }
        return fileResponse(media.getStorageKey());
    }

    private ResponseEntity<byte[]> fileResponse(String key) {
        ObjectStorageService.StorageFile file = storageService.download(key);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                .body(file.bytes());
    }
}
