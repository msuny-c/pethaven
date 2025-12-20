package com.pethaven.service;

import com.pethaven.entity.AnimalEntity;
import com.pethaven.entity.AnimalMediaEntity;
import com.pethaven.model.enums.AnimalStatus;
import com.pethaven.repository.AnimalMediaRepository;
import com.pethaven.repository.AnimalRepository;
import com.pethaven.repository.PersonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final AnimalMediaRepository animalMediaRepository;
    private final NotificationService notificationService;
    private final PersonRepository personRepository;

    public AnimalService(AnimalRepository animalRepository, AnimalMediaRepository animalMediaRepository, NotificationService notificationService, PersonRepository personRepository) {
        this.animalRepository = animalRepository;
        this.animalMediaRepository = animalMediaRepository;
        this.notificationService = notificationService;
        this.personRepository = personRepository;
    }

    public List<AnimalEntity> getCatalog(String species, AnimalStatus status) {
        return animalRepository.findCatalog(species, status == null ? null : status.name());
    }

    public List<String> getAvailableSpecies() {
        return animalRepository.findAvailableSpecies();
    }

    public Optional<AnimalEntity> getById(Long id) {
        return animalRepository.findById(id);
    }

    public Long createAnimal(AnimalEntity animal, boolean forcePendingReview) {
        if (forcePendingReview) {
            animal.setStatus(com.pethaven.model.enums.AnimalStatus.pending_review);
        }
        if (animal.getStatus() == null) {
            animal.setStatus(com.pethaven.model.enums.AnimalStatus.quarantine);
        }
        AnimalEntity saved = animalRepository.save(animal);
        if (saved.getStatus() == com.pethaven.model.enums.AnimalStatus.pending_review) {
            notifyAdminsPendingReview(saved);
        }
        return saved.getId();
    }

    @Transactional
    public AnimalEntity updateAnimal(Long id, AnimalEntity payload, boolean forcePendingReview) {
        AnimalEntity existing = animalRepository.findById(id).orElseThrow();
        if (payload.getName() != null) {
            existing.setName(payload.getName());
        }
        if (payload.getSpecies() != null) {
            existing.setSpecies(payload.getSpecies());
        }
        if (payload.getBreed() != null) {
            existing.setBreed(payload.getBreed());
        }
        if (payload.getAgeMonths() != null) {
            existing.setAgeMonths(payload.getAgeMonths());
        }
        if (payload.getGender() != null) {
            existing.setGender(payload.getGender());
        }
        if (payload.getDescription() != null) {
            existing.setDescription(payload.getDescription());
        }
        if (payload.getBehaviorNotes() != null) {
            existing.setBehaviorNotes(payload.getBehaviorNotes());
        }
        if (payload.getMedicalSummary() != null) {
            existing.setMedicalSummary(payload.getMedicalSummary());
        }
        if (payload.getStatus() != null) {
            if (forcePendingReview && (payload.getStatus() == com.pethaven.model.enums.AnimalStatus.available || payload.getStatus() == com.pethaven.model.enums.AnimalStatus.reserved)) {
                existing.setStatus(com.pethaven.model.enums.AnimalStatus.pending_review);
            } else {
                existing.setStatus(payload.getStatus());
            }
        }
        if (payload.getVaccinated() != null) {
            existing.setVaccinated(payload.getVaccinated());
        }
        if (payload.getSterilized() != null) {
            existing.setSterilized(payload.getSterilized());
        }
        if (payload.getMicrochipped() != null) {
            existing.setMicrochipped(payload.getMicrochipped());
        }
        AnimalEntity saved = animalRepository.save(existing);
        if (saved.getStatus() == com.pethaven.model.enums.AnimalStatus.pending_review) {
            notifyAdminsPendingReview(saved);
        }
        return saved;
    }

    public void updateStatus(Long animalId, AnimalStatus status) {
        animalRepository.findById(animalId).ifPresent(entity -> {
            if (entity.getStatus() == AnimalStatus.adopted) {
                throw new IllegalStateException("Статус переданного животного менять нельзя");
            }
            entity.setStatus(status);
            animalRepository.save(entity);
        });
    }

    public void delete(Long animalId) {
        animalRepository.deleteById(animalId);
    }

    public AnimalMediaEntity addMedia(Long animalId, String storageKey, String description) {
        AnimalEntity animal = animalRepository.findById(animalId).orElseThrow();
        AnimalMediaEntity entity = new AnimalMediaEntity();
        entity.setAnimal(animal);
        entity.setStorageKey(storageKey);
        entity.setDescription(description);
        return animalMediaRepository.save(entity);
    }

    public AnimalMediaEntity addMedia(Long animalId, AnimalMediaEntity media) {
        AnimalEntity animal = animalRepository.findById(animalId).orElseThrow();
        media.setAnimal(animal);
        if (media.getStorageKey() == null) {
            throw new IllegalArgumentException("storageKey is required for media");
        }
        return animalMediaRepository.save(media);
    }

    public void addBehaviorNote(Long animalId, String note, Long authorId) {
        if (note == null || note.isBlank()) {
            throw new IllegalArgumentException("Заметка не может быть пустой");
        }
        AnimalEntity animal = animalRepository.findById(animalId).orElseThrow();
        String authorTag = authorId != null ? ("#" + authorId) : "волонтёр";
        String existing = animal.getBehaviorNotes() != null ? animal.getBehaviorNotes() + "\n" : "";
        String entry = "[" + java.time.LocalDate.now() + "] " + authorTag + ": " + note.trim();
        animal.setBehaviorNotes(existing + entry);
        animalRepository.save(animal);
    }

    public AnimalEntity updateMedical(Long id, AnimalEntity payload) {
        AnimalEntity existing = animalRepository.findById(id).orElseThrow();
        if (payload.getVaccinated() != null) {
            existing.setVaccinated(payload.getVaccinated());
        }
        if (payload.getSterilized() != null) {
            existing.setSterilized(payload.getSterilized());
        }
        if (payload.getMicrochipped() != null) {
            existing.setMicrochipped(payload.getMicrochipped());
        }
        if (payload.getMedicalSummary() != null) {
            existing.setMedicalSummary(payload.getMedicalSummary());
        }
        return animalRepository.save(existing);
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

    public List<AnimalMediaEntity> getMedia(Long animalId) {
        return animalMediaRepository.findByAnimalIdOrderByUploadedAtDesc(animalId);
    }
}
