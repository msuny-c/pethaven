package com.pethaven.service;

import com.pethaven.dto.MedicalRecordRequest;
import com.pethaven.dto.MedicalRecordResponse;
import com.pethaven.entity.MedicalRecordEntity;
import com.pethaven.mapper.MedicalRecordMapper;
import com.pethaven.repository.MedicalRecordRepository;
import com.pethaven.repository.AnimalRepository;
import com.pethaven.repository.PersonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicalService {

    private final MedicalRecordRepository medicalRepository;
    private final AnimalRepository animalRepository;
    private final PersonRepository personRepository;
    private final MedicalRecordMapper medicalRecordMapper;

    public MedicalService(MedicalRecordRepository medicalRepository,
                          AnimalRepository animalRepository,
                          PersonRepository personRepository,
                          MedicalRecordMapper medicalRecordMapper) {
        this.medicalRepository = medicalRepository;
        this.animalRepository = animalRepository;
        this.personRepository = personRepository;
        this.medicalRecordMapper = medicalRecordMapper;
    }

    public List<MedicalRecordResponse> getByAnimal(Long animalId) {
        List<MedicalRecordResponse> responses = medicalRecordMapper.toResponses(medicalRepository.findByAnimalIdOrderByIdDesc(animalId));
        return enrichWithVetNames(responses);
    }

    @Transactional
    public Long addRecord(MedicalRecordRequest request, Long vetId) {
        if (vetId == null) {
            throw new IllegalArgumentException("Не указан ветеринар");
        }
        if (request.nextDueDate() != null && request.nextDueDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Дата следующей процедуры не может быть в прошлом");
        }
        if (!animalRepository.existsById(request.animalId())) {
            throw new IllegalArgumentException("Животное не найдено");
        }
        MedicalRecordEntity record = medicalRecordMapper.toEntity(request);
        record.setVetId(vetId);
        return medicalRepository.saveAndFlush(record).getId();
    }

    public List<MedicalRecordResponse> getUpcoming(int days) {
        LocalDate toDate = LocalDate.now().plusDays(days);
        List<MedicalRecordResponse> responses = medicalRecordMapper.toResponses(medicalRepository.findUpcoming(toDate));
        return enrichWithVetNames(responses);
    }

    private List<MedicalRecordResponse> enrichWithVetNames(List<MedicalRecordResponse> responses) {
        var vetIds = responses.stream()
                .map(MedicalRecordResponse::vetId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Map<Long, com.pethaven.entity.PersonEntity> vets = vetIds.isEmpty()
                ? Map.of()
                : personRepository.findAllById(vetIds).stream()
                .collect(Collectors.toMap(com.pethaven.entity.PersonEntity::getId, v -> v));

        return responses.stream().map(r -> {
            com.pethaven.entity.PersonEntity vet = r.vetId() != null ? vets.get(r.vetId()) : null;
            String firstName = vet != null ? vet.getFirstName() : null;
            String lastName = vet != null ? vet.getLastName() : null;
            return new MedicalRecordResponse(r.id(), r.animalId(), r.vetId(), firstName, lastName, r.procedure(), r.description(), r.nextDueDate());
        }).toList();
    }
}
