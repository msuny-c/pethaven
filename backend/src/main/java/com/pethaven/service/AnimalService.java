package com.pethaven.service;

import com.pethaven.dto.AnimalCreateRequest;
import com.pethaven.dto.AnimalMediaResponse;
import com.pethaven.dto.AnimalMedicalUpdateRequest;
import com.pethaven.dto.AnimalNoteResponse;
import com.pethaven.dto.AnimalResponse;
import com.pethaven.dto.AnimalUpdateRequest;
import com.pethaven.entity.AnimalEntity;
import com.pethaven.entity.AnimalMediaEntity;
import com.pethaven.entity.AnimalNoteEntity;
import com.pethaven.mapper.AnimalMapper;
import com.pethaven.mapper.AnimalNoteMapper;
import com.pethaven.model.enums.AnimalStatus;
import com.pethaven.repository.AnimalMediaRepository;
import com.pethaven.repository.AnimalRepository;
import com.pethaven.repository.AnimalNoteRepository;
import com.pethaven.repository.PersonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.NoSuchElementException;

@Service
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final AnimalMediaRepository animalMediaRepository;
    private final AnimalNoteRepository animalNoteRepository;
    private final NotificationService notificationService;
    private final com.pethaven.repository.MedicalRecordRepository medicalRecordRepository;
    private final PersonRepository personRepository;
    private final AnimalMapper animalMapper;
    private final AnimalNoteMapper animalNoteMapper;
    private final SettingService settingService;

    public AnimalService(AnimalRepository animalRepository,
                         AnimalMediaRepository animalMediaRepository,
                         AnimalNoteRepository animalNoteRepository,
                         NotificationService notificationService,
                         com.pethaven.repository.MedicalRecordRepository medicalRecordRepository,
                         PersonRepository personRepository,
                         AnimalMapper animalMapper,
                         AnimalNoteMapper animalNoteMapper,
                         SettingService settingService) {
        this.animalRepository = animalRepository;
        this.animalMediaRepository = animalMediaRepository;
        this.animalNoteRepository = animalNoteRepository;
        this.notificationService = notificationService;
        this.medicalRecordRepository = medicalRecordRepository;
        this.personRepository = personRepository;
        this.animalMapper = animalMapper;
        this.animalNoteMapper = animalNoteMapper;
        this.settingService = settingService;
    }

    public List<AnimalResponse> getCatalog(String species, AnimalStatus status, boolean includePending, boolean hideInternalFlags, boolean onlyAvailable) {
        List<AnimalEntity> animals = animalRepository.findCatalog(species, status == null ? null : status.name(), includePending);
        List<AnimalResponse> responses = animalMapper.toResponses(animals);
        if (!includePending) {
            responses = responses.stream()
                    .filter(a -> a.pendingAdminReview() == null || !a.pendingAdminReview())
                    .toList();
        }
        if (onlyAvailable) {
            responses = responses.stream()
                    .filter(a -> a.status() == AnimalStatus.available)
                    .toList();
        }
        if (hideInternalFlags) {
            responses = responses.stream().map(this::sanitizeForCandidate).toList();
        }
        return responses;
    }

    public List<String> getAvailableSpecies() {
        List<String> fromSettings = settingService.getList(com.pethaven.service.SettingService.SPECIES_LIST);
        if (fromSettings != null && !fromSettings.isEmpty()) {
            return fromSettings;
        }
        return animalRepository.findAvailableSpecies();
    }

    public Optional<AnimalResponse> getById(Long id) {
        return animalRepository.findById(id).map(animalMapper::toResponse);
    }

    public Optional<AnimalEntity> getEntity(Long id) {
        return animalRepository.findById(id);
    }

    private AnimalResponse sanitizeForCandidate(AnimalResponse response) {
        return new AnimalResponse(
                response.id(),
                response.name(),
                response.species(),
                response.breed(),
                response.ageMonths(),
                response.gender(),
                response.description(),
                response.status(),
                null,
                null,
                null,
                response.photos()
        );
    }

    public AnimalResponse createAnimal(AnimalCreateRequest request, boolean forcePendingReview) {
        AnimalEntity animal = animalMapper.toEntity(request);
        if (!forcePendingReview && animal.getStatus() == com.pethaven.model.enums.AnimalStatus.pending_review) {
            throw new IllegalArgumentException("Статус 'на проверке' устанавливается автоматически администратором");
        }
        animal.setPendingAdminReview(Boolean.TRUE);
        if (animal.getStatus() == null) {
            animal.setStatus(com.pethaven.model.enums.AnimalStatus.quarantine);
        }
        AnimalEntity saved = animalRepository.save(animal);
        notifyAdminsPendingReview(saved);
        return animalMapper.toResponse(saved);
    }

    @Transactional
    public AnimalResponse updateAnimal(Long id, AnimalUpdateRequest payload, boolean forcePendingReview) {
        AnimalEntity existing = animalRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Animal not found: " + id));
        if (payload.status() != null && !forcePendingReview && payload.status() == com.pethaven.model.enums.AnimalStatus.pending_review) {
            throw new IllegalArgumentException("Статус 'на проверке' устанавливается автоматически администратором");
        }
        if (payload.status() != null && forcePendingReview && (payload.status() == com.pethaven.model.enums.AnimalStatus.available
                || payload.status() == com.pethaven.model.enums.AnimalStatus.reserved)) {
            existing.setPendingAdminReview(Boolean.TRUE);
        }
        animalMapper.update(existing, payload);
        AnimalEntity saved = animalRepository.save(existing);
        if (Boolean.TRUE.equals(saved.getPendingAdminReview())) {
            notifyAdminsPendingReview(saved);
        }
        return animalMapper.toResponse(saved);
    }

    public void updateStatus(Long animalId, AnimalStatus status, boolean allowPendingReview) {
        AnimalEntity entity = animalRepository.findById(animalId)
                .orElseThrow(() -> new NoSuchElementException("Animal not found: " + animalId));
        if (entity.getStatus() == AnimalStatus.adopted) {
            throw new IllegalStateException("Статус переданного животного менять нельзя");
        }
        if (!allowPendingReview && status == AnimalStatus.pending_review) {
            throw new IllegalArgumentException("Статус 'на проверке' устанавливается автоматически администратором");
        }
        entity.setStatus(status);
        animalRepository.save(entity);
    }

    public void delete(Long animalId) {
        medicalRecordRepository.deleteByAnimalId(animalId);
        animalRepository.deleteById(animalId);
    }

    public AnimalMediaResponse addMedia(Long animalId, String storageKey, String description) {
        AnimalEntity animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new NoSuchElementException("Animal not found: " + animalId));
        AnimalMediaEntity entity = new AnimalMediaEntity();
        entity.setAnimal(animal);
        entity.setStorageKey(storageKey);
        entity.setDescription(description);
        return animalMapper.toMediaResponse(animalMediaRepository.save(entity));
    }

    public AnimalNoteResponse addBehaviorNote(Long animalId, String note, Long authorId) {
        if (note == null || note.isBlank()) {
            throw new IllegalArgumentException("Заметка не может быть пустой");
        }
        AnimalEntity animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new NoSuchElementException("Animal not found: " + animalId));
        AnimalNoteEntity entity = new AnimalNoteEntity();
        entity.setAnimalId(animal.getId());
        entity.setAuthorId(authorId);
        entity.setNote(note.trim());
        return animalNoteMapper.toResponse(animalNoteRepository.save(entity));
    }

    public AnimalResponse updateMedical(Long id, AnimalMedicalUpdateRequest payload) {
        AnimalEntity existing = animalRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Animal not found: " + id));
        if (payload.readyForAdoption() != null) {
            existing.setReadyForAdoption(payload.readyForAdoption());
        }
        return animalMapper.toResponse(animalRepository.save(existing));
    }

    public AnimalEntity reviewAnimal(Long id, boolean approved, String comment) {
        AnimalEntity entity = animalRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Animal not found: " + id));
        if (approved) {
            entity.setPendingAdminReview(Boolean.FALSE);
            entity.setAdminReviewComment(null);
        } else {
            entity.setPendingAdminReview(Boolean.FALSE);
            entity.setStatus(com.pethaven.model.enums.AnimalStatus.quarantine);
            entity.setAdminReviewComment(comment);
        }
        AnimalEntity saved = animalRepository.save(entity);
        if (approved) {
            personRepository.findActiveByRole(com.pethaven.model.enums.SystemRole.coordinator.name())
                    .forEach(coord -> notificationService.push(
                            coord.getId(),
                            com.pethaven.model.enums.NotificationType.new_application,
                            "Карточка подтверждена",
                            "Администратор утвердил карточку питомца #" + saved.getId()
            ));
        } else {
            personRepository.findActiveByRole(com.pethaven.model.enums.SystemRole.coordinator.name())
                    .forEach(coord -> notificationService.push(
                            coord.getId(),
                            com.pethaven.model.enums.NotificationType.new_application,
                            "Карточка отклонена",
                            "Администратор отправил карточку питомца #" + saved.getId() + " на доработку"
                    ));
        }
        return saved;
    }

    private void notifyAdminsPendingReview(AnimalEntity animal) {
        personRepository.findActiveByRole(com.pethaven.model.enums.SystemRole.admin.name())
                .forEach(admin -> notificationService.push(
                        admin.getId(),
                        com.pethaven.model.enums.NotificationType.new_application,
                        "Карточка на проверке",
                        "Новая карточка питомца #" + animal.getId() + " ожидает проверки"
                ));
    }

    public List<AnimalMediaResponse> getMedia(Long animalId) {
        return animalMapper.toMediaResponses(animalMediaRepository.findByAnimalIdOrderByUploadedAtDesc(animalId));
    }

    public List<AnimalNoteResponse> getNotes(Long animalId) {
        return animalNoteMapper.toResponses(animalNoteRepository.findByAnimalIdOrderByCreatedAtDesc(animalId));
    }

    public void requestReview(Long animalId) {
        AnimalEntity entity = animalRepository.findById(animalId)
                .orElseThrow(() -> new NoSuchElementException("Animal not found: " + animalId));
        if (Boolean.TRUE.equals(entity.getPendingAdminReview())) {
            throw new IllegalStateException("Карточка уже на проверке");
        }
        if (entity.getStatus() == com.pethaven.model.enums.AnimalStatus.adopted) {
            throw new IllegalStateException("Карточка пристроенного питомца не отправляется на проверку");
        }
        if (Boolean.FALSE.equals(entity.getPendingAdminReview()) && entity.getAdminReviewComment() == null) {
            throw new IllegalStateException("Карточка уже утверждена администратором");
        }
        entity.setPendingAdminReview(Boolean.TRUE);
        entity.setAdminReviewComment(null);
        animalRepository.save(entity);
        notifyAdminsPendingReview(entity);
    }
}
