package com.pethaven.service;

import com.pethaven.dto.MedicalRecordRequest;
import com.pethaven.dto.MedicalRecordResponse;
import com.pethaven.entity.MedicalRecordEntity;
import com.pethaven.mapper.MedicalRecordMapper;
import com.pethaven.repository.MedicalRecordRepository;
import com.pethaven.repository.AnimalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class MedicalService {

    private final MedicalRecordRepository medicalRepository;
    private final AnimalRepository animalRepository;
    private final MedicalRecordMapper medicalRecordMapper;

    public MedicalService(MedicalRecordRepository medicalRepository,
                          AnimalRepository animalRepository,
                          MedicalRecordMapper medicalRecordMapper) {
        this.medicalRepository = medicalRepository;
        this.animalRepository = animalRepository;
        this.medicalRecordMapper = medicalRecordMapper;
    }

    public List<MedicalRecordResponse> getByAnimal(Long animalId) {
        return medicalRecordMapper.toResponses(medicalRepository.findByAnimalIdOrderByIdDesc(animalId));
    }

    @Transactional
    public Long addRecord(MedicalRecordRequest request, Long vetId) {
        if (vetId == null) {
            throw new IllegalArgumentException("Не указан ветеринар");
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
        return medicalRecordMapper.toResponses(medicalRepository.findUpcoming(toDate));
    }

}
