package com.pethaven.service;

import com.pethaven.entity.AnimalEntity;
import com.pethaven.entity.AnimalMediaEntity;
import com.pethaven.model.enums.AnimalStatus;
import com.pethaven.repository.AnimalMediaRepository;
import com.pethaven.repository.AnimalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final AnimalMediaRepository animalMediaRepository;

    public AnimalService(AnimalRepository animalRepository, AnimalMediaRepository animalMediaRepository) {
        this.animalRepository = animalRepository;
        this.animalMediaRepository = animalMediaRepository;
    }

    public List<AnimalEntity> getCatalog(String species, AnimalStatus status) {
        return animalRepository.findCatalog(species, status == null ? null : status.name());
    }

    public Optional<AnimalEntity> getById(Long id) {
        return animalRepository.findById(id);
    }

    public Long createAnimal(AnimalEntity animal) {
        return animalRepository.save(animal).getId();
    }

    @Transactional
    public AnimalEntity updateAnimal(Long id, AnimalEntity payload) {
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
            existing.setStatus(payload.getStatus());
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
        return animalRepository.save(existing);
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

    public List<AnimalMediaEntity> getMedia(Long animalId) {
        return animalMediaRepository.findByAnimalIdOrderByUploadedAtDesc(animalId);
    }
}
