package com.pethaven.service;

import com.pethaven.dto.ShiftCreateRequest;
import com.pethaven.dto.ShiftResponse;
import com.pethaven.dto.TaskShiftAssignmentRequest;
import com.pethaven.entity.ShiftEntity;
import com.pethaven.entity.ShiftVolunteerEntity;
import com.pethaven.entity.TaskShiftEntity;
import com.pethaven.entity.TaskShiftId;
import com.pethaven.entity.ShiftVolunteerId;
import com.pethaven.model.enums.AttendanceStatus;
import com.pethaven.model.enums.ShiftType;
import com.pethaven.mapper.ShiftMapper;
import com.pethaven.repository.ShiftRepository;
import com.pethaven.repository.ShiftVolunteerRepository;
import com.pethaven.repository.TaskShiftRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final ShiftVolunteerRepository shiftVolunteerRepository;
    private final TaskShiftRepository taskShiftRepository;
    private final ShiftMapper shiftMapper;

    public ShiftService(ShiftRepository shiftRepository,
                        ShiftVolunteerRepository shiftVolunteerRepository,
                        TaskShiftRepository taskShiftRepository,
                        ShiftMapper shiftMapper) {
        this.shiftRepository = shiftRepository;
        this.shiftVolunteerRepository = shiftVolunteerRepository;
        this.taskShiftRepository = taskShiftRepository;
        this.shiftMapper = shiftMapper;
    }

    public List<ShiftResponse> getUpcoming(LocalDate from) {
        return shiftMapper.toResponses(shiftRepository.findByShiftDateGreaterThanEqualOrderByShiftDateAsc(from));
    }

    public ShiftResponse createShift(ShiftCreateRequest request) {
        ShiftEntity shift = shiftMapper.toEntity(request);
        return shiftMapper.toResponse(shiftRepository.save(shift));
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

    public ShiftVolunteerEntity markAttendance(Long shiftId, Long volunteerId, AttendanceStatus status, Integer workedHours) {
        ShiftVolunteerEntity entity = shiftVolunteerRepository.findById(new ShiftVolunteerId(shiftId, volunteerId))
                .orElseThrow(() -> new NoSuchElementException("Смена или волонтёр не найдены"));
        entity.setAttendanceStatus(status);
        if (workedHours != null) {
            entity.setWorkedHours(workedHours);
        }
        return shiftVolunteerRepository.save(entity);
    }

    public ShiftVolunteerEntity submitShift(Long shiftId, Long volunteerId, Integer workedHours) {
        ShiftVolunteerEntity entity = shiftVolunteerRepository.findById(new ShiftVolunteerId(shiftId, volunteerId))
                .orElseThrow(() -> new NoSuchElementException("Смена или волонтёр не найдены"));
        if (entity.getAttendanceStatus() == AttendanceStatus.absent) {
            throw new IllegalStateException("Нельзя сдать смену со статусом 'отсутствовал'");
        }
        entity.setAttendanceStatus(AttendanceStatus.attended);
        OffsetDateTime now = OffsetDateTime.now();
        entity.setSubmittedAt(now);
        entity.setWorkedHours(resolveHours(shiftId, workedHours, entity, now));
        return shiftVolunteerRepository.save(entity);
    }

    public ShiftVolunteerEntity approveShift(Long shiftId, Long volunteerId, Integer workedHours) {
        ShiftVolunteerEntity entity = shiftVolunteerRepository.findById(new ShiftVolunteerId(shiftId, volunteerId))
                .orElseThrow(() -> new NoSuchElementException("Смена или волонтёр не найдены"));
        entity.setAttendanceStatus(AttendanceStatus.attended);
        OffsetDateTime now = OffsetDateTime.now();
        entity.setApprovedAt(now);
        entity.setWorkedHours(resolveHours(shiftId, workedHours, entity, now));
        return shiftVolunteerRepository.save(entity);
    }

    private int resolveHours(Long shiftId, Integer requested, ShiftVolunteerEntity entity, OffsetDateTime endTime) {
        if (requested != null) {
            return requested;
        }
        if (entity.getWorkedHours() != null && entity.getWorkedHours() > 0) {
            return entity.getWorkedHours();
        }
        OffsetDateTime start = entity.getSignedUpAt();
        if (start != null && endTime != null && endTime.isAfter(start)) {
            long minutes = Duration.between(start, endTime).toMinutes();
            int hours = (int) Math.ceil(minutes / 60.0);
            return Math.max(hours, 1);
        }
        ShiftType type = shiftRepository.findById(shiftId)
                .map(ShiftEntity::getShiftType)
                .orElse(ShiftType.full_day);
        return switch (type) {
            case full_day -> 8;
            case morning, evening -> 4;
        };
    }
}
