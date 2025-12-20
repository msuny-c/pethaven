package com.pethaven.service;

import com.pethaven.entity.ShiftEntity;
import com.pethaven.entity.ShiftVolunteerEntity;
import com.pethaven.entity.TaskShiftEntity;
import com.pethaven.entity.TaskShiftId;
import com.pethaven.repository.ShiftVolunteerRepository;
import com.pethaven.repository.ShiftRepository;
import com.pethaven.repository.TaskShiftRepository;
import com.pethaven.dto.TaskShiftAssignmentRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final ShiftVolunteerRepository shiftVolunteerRepository;
    private final TaskShiftRepository taskShiftRepository;

    public ShiftService(ShiftRepository shiftRepository,
                        ShiftVolunteerRepository shiftVolunteerRepository,
                        TaskShiftRepository taskShiftRepository) {
        this.shiftRepository = shiftRepository;
        this.shiftVolunteerRepository = shiftVolunteerRepository;
        this.taskShiftRepository = taskShiftRepository;
    }

    public List<ShiftEntity> getUpcoming(LocalDate from) {
        return shiftRepository.findByShiftDateGreaterThanEqualOrderByShiftDateAsc(from);
    }

    public ShiftEntity createShift(ShiftEntity shift) {
        return shiftRepository.save(shift);
    }

    @Transactional
    public void signup(Long shiftId, Long volunteerId) {
        try {
            shiftRepository.signup(shiftId, volunteerId);
        } catch (org.springframework.dao.DataAccessException ex) {
            throw new IllegalStateException(toUserMessage(ex));
        }
    }

    private String toUserMessage(org.springframework.dao.DataAccessException ex) {
        Throwable root = ex.getMostSpecificCause();
        String message = root != null ? root.getMessage() : ex.getMessage();

        if (root instanceof org.postgresql.util.PSQLException psql && psql.getServerErrorMessage() != null) {
            String serverMessage = psql.getServerErrorMessage().getMessage();
            if (serverMessage != null && !serverMessage.isBlank()) {
                message = serverMessage;
            }
        }

        if (message == null) {
            return "Невозможно записаться на смену";
        }
        String normalized = message.replace('\n', ' ').replace('\r', ' ').trim();

        if (normalized.contains("Volunteer already signed up for this shift")) {
            return "Вы уже записаны на эту смену";
        }
        if (normalized.contains("Only volunteers can sign up for shifts")) {
            return "Записаться на смену может только волонтёр";
        }
        if (normalized.contains("violates foreign key constraint") && normalized.contains("shift")) {
            return "Смена не найдена";
        }
        if (normalized.contains("not a procedure") && normalized.contains("signup_for_shift")) {
            return "Сервис записи на смену недоступен: не применены миграции БД";
        }

        return normalized;
    }

    public List<ShiftVolunteerEntity> getVolunteers(Long shiftId) {
        return shiftVolunteerRepository.findByIdShiftId(shiftId);
    }

    public List<TaskShiftEntity> getShiftTasks(Long shiftId) {
        return taskShiftRepository.findByIdShiftId(shiftId);
    }

    public TaskShiftEntity assignTask(TaskShiftAssignmentRequest request) {
        TaskShiftEntity entity = new TaskShiftEntity();
        entity.setId(new TaskShiftId(request.taskId(), request.shiftId()));
        entity.setProgressNotes(request.progressNotes());
        return taskShiftRepository.save(entity);
    }
}
