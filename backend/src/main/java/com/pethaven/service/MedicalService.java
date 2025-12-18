package com.pethaven.service;

import com.pethaven.entity.MedicalRecordEntity;
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

    public MedicalService(MedicalRecordRepository medicalRepository, AnimalRepository animalRepository) {
        this.medicalRepository = medicalRepository;
        this.animalRepository = animalRepository;
    }

    public List<MedicalRecordEntity> getByAnimal(Long animalId) {
        return medicalRepository.findByAnimalIdOrderByAdministeredDateDesc(animalId);
    }

    @Transactional
    public Long addRecord(MedicalRecordEntity record) {
        // Автозаполнение плановой даты по типу процедуры
        if (record.getNextDueDate() == null) {
            record.setNextDueDate(suggestNextDue(record.getProcedure(), record.getAdministeredDate()));
        }
        Long id = medicalRepository.save(record).getId();
        updateAnimalFlags(record);
        return id;
    }

    public List<MedicalRecordEntity> getUpcoming(int days) {
        LocalDate toDate = LocalDate.now().plusDays(days);
        return medicalRepository.findUpcoming(toDate);
    }

    private void updateAnimalFlags(MedicalRecordEntity record) {
        animalRepository.findById(record.getAnimalId()).ifPresent(animal -> {
            switch (record.getProcedure()) {
                case "vaccination" -> animal.setVaccinated(true);
                case "sterilization" -> animal.setSterilized(true);
                case "microchip" -> animal.setMicrochipped(true);
                default -> {
                }
            }
            animalRepository.save(animal);
        });
    }

    private LocalDate suggestNextDue(String procedure, LocalDate administeredDate) {
        if (administeredDate == null) {
            administeredDate = LocalDate.now();
        }
        return switch (procedure) {
            case "vaccination" -> administeredDate.plusMonths(12);
            case "checkup" -> administeredDate.plusMonths(6);
            case "treatment" -> administeredDate.plusMonths(1);
            default -> null;
        };
    }
}
