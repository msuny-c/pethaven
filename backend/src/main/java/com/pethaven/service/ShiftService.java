package com.pethaven.service;

import com.pethaven.dto.ShiftCreateRequest;
import com.pethaven.dto.ShiftResponse;
import com.pethaven.dto.ShiftTaskView;
import com.pethaven.dto.TaskShiftAssignmentRequest;
import com.pethaven.dto.TaskShiftUpdateRequest;
import com.pethaven.dto.VolunteerShiftResponse;
import com.pethaven.entity.AnimalEntity;
import com.pethaven.entity.ShiftEntity;
import com.pethaven.entity.ShiftVolunteerEntity;
import com.pethaven.entity.TaskEntity;
import com.pethaven.entity.TaskShiftEntity;
import com.pethaven.entity.TaskShiftId;
import com.pethaven.entity.ShiftVolunteerId;
import com.pethaven.entity.PersonEntity;
import com.pethaven.model.enums.AttendanceStatus;
import com.pethaven.model.enums.ShiftType;
import com.pethaven.model.enums.TaskStatus;
import com.pethaven.mapper.ShiftMapper;
import com.pethaven.repository.AnimalRepository;
import com.pethaven.repository.PersonRepository;
import com.pethaven.repository.ShiftRepository;
import com.pethaven.repository.ShiftVolunteerRepository;
import com.pethaven.repository.TaskRepository;
import com.pethaven.repository.TaskShiftRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final ShiftVolunteerRepository shiftVolunteerRepository;
    private final TaskShiftRepository taskShiftRepository;
    private final TaskRepository taskRepository;
    private final AnimalRepository animalRepository;
    private final PersonRepository personRepository;
    private final ShiftMapper shiftMapper;

    public ShiftService(ShiftRepository shiftRepository,
                        ShiftVolunteerRepository shiftVolunteerRepository,
                        TaskShiftRepository taskShiftRepository,
                        TaskRepository taskRepository,
                        AnimalRepository animalRepository,
                        PersonRepository personRepository,
                        ShiftMapper shiftMapper) {
        this.shiftRepository = shiftRepository;
        this.shiftVolunteerRepository = shiftVolunteerRepository;
        this.taskShiftRepository = taskShiftRepository;
        this.taskRepository = taskRepository;
        this.animalRepository = animalRepository;
        this.personRepository = personRepository;
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
            ShiftVolunteerId id = new ShiftVolunteerId(shiftId, volunteerId);
            Optional<ShiftVolunteerEntity> existing = shiftVolunteerRepository.findById(id);
            if (existing.isPresent()) {
                ShiftVolunteerEntity entity = existing.get();
                if (entity.getAttendanceStatus() == AttendanceStatus.absent) {
                    entity.setAttendanceStatus(AttendanceStatus.signed_up);
                    entity.setCancelReason(null);
                    entity.setSubmittedAt(null);
                    entity.setApprovedAt(null);
                    entity.setWorkedHours(0);
                    shiftVolunteerRepository.save(entity);
                    return;
                } else {
                    throw new IllegalStateException("Вы уже записаны на эту смену");
                }
            }
            LocalDate date = shiftRepository.findById(shiftId)
                    .map(ShiftEntity::getShiftDate)
                    .orElseThrow(() -> new NoSuchElementException("Смена не найдена"));
            List<ShiftVolunteerEntity> myShifts = shiftVolunteerRepository.findByIdVolunteerId(volunteerId);
            Set<Long> otherShiftIds = myShifts.stream()
                    .filter(v -> !v.getId().getShiftId().equals(shiftId) && v.getAttendanceStatus() != AttendanceStatus.absent)
                    .map(v -> v.getId().getShiftId())
                    .collect(Collectors.toSet());
            if (!otherShiftIds.isEmpty()) {
                Map<Long, ShiftEntity> other = shiftRepository.findAllById(otherShiftIds).stream()
                        .collect(Collectors.toMap(ShiftEntity::getId, Function.identity()));
                boolean conflict = other.values().stream().anyMatch(s -> date.equals(s.getShiftDate()));
                if (conflict) {
                    throw new IllegalStateException("Вы уже записаны на другую смену в этот день");
                }
            }
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
        if (normalized.contains("Volunteer already signed up for another shift on this date")) {
            return "Вы уже записаны на другую смену в этот день";
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

    public List<ShiftTaskView> getShiftTasks(Long shiftId) {
        return toViews(taskShiftRepository.findByIdShiftId(shiftId));
    }

    public TaskShiftEntity assignTask(TaskShiftAssignmentRequest request) {
        TaskShiftEntity entity = new TaskShiftEntity();
        entity.setId(new TaskShiftId(request.taskId(), request.shiftId()));
        entity.setProgressNotes(request.progressNotes());
        TaskShiftEntity saved = taskShiftRepository.save(entity);
        refreshTaskStatus(request.taskId());
        return saved;
    }

    public void removeTask(Long shiftId, Long taskId) {
        TaskShiftEntity assignment = taskShiftRepository.findById(new TaskShiftId(taskId, shiftId))
                .orElseThrow(() -> new NoSuchElementException("Задача или смена не найдены"));
        taskShiftRepository.delete(assignment);
        refreshTaskStatus(taskId);
    }

    public ShiftVolunteerEntity unsubscribe(Long shiftId, Long volunteerId, String reason) {
        ShiftVolunteerEntity entity = shiftVolunteerRepository.findById(new ShiftVolunteerId(shiftId, volunteerId))
                .orElseThrow(() -> new NoSuchElementException("Смена или волонтёр не найдены"));
        if (entity.getApprovedAt() != null) {
            throw new IllegalStateException("Смена уже закрыта, отписка невозможна");
        }
        entity.setAttendanceStatus(AttendanceStatus.absent);
        entity.setCancelReason(reason);
        entity.setSubmittedAt(null);
        entity.setWorkedHours(0);
        return shiftVolunteerRepository.save(entity);
    }

    public ShiftTaskView updateTask(Long shiftId, Long taskId, TaskShiftUpdateRequest request, Long actorId, boolean canManageAny) {
        if (actorId == null) {
            throw new AccessDeniedException("Требуется авторизация");
        }
        boolean shiftClosed = shiftVolunteerRepository.findByIdShiftId(shiftId).stream().allMatch(v -> v.getApprovedAt() != null);
        if (shiftClosed) {
            throw new AccessDeniedException("Смена уже закрыта");
        }
        TaskShiftEntity assignment = taskShiftRepository.findById(new TaskShiftId(taskId, shiftId))
                .orElseThrow(() -> new NoSuchElementException("Задача или смена не найдены"));
        if (!canManageAny) {
            ShiftVolunteerEntity actorShift = shiftVolunteerRepository.findById(new ShiftVolunteerId(shiftId, actorId))
                    .orElse(null);
            if (actorShift == null || actorShift.getAttendanceStatus() == AttendanceStatus.absent) {
                throw new AccessDeniedException("Недостаточно прав для изменения задачи");
            }
        }
        if (request.progressNotes() != null) {
            assignment.setProgressNotes(request.progressNotes());
        }
        if (request.taskState() != null) {
            assignment.setTaskState(request.taskState());
            boolean done = "done".equalsIgnoreCase(request.taskState());
            assignment.setCompleted(done);
            assignment.setCompletedAt(done ? OffsetDateTime.now() : null);
            if ("open".equalsIgnoreCase(request.taskState())) {
                assignment.setCompletedBy(null);
            } else {
                assignment.setCompletedBy(actorId);
            }
        }
        if (request.workedHours() != null) {
            assignment.setWorkedHours(request.workedHours());
        }
        TaskShiftEntity saved = taskShiftRepository.save(assignment);
        refreshTaskStatus(taskId);
        return toViews(List.of(saved)).stream().findFirst().orElseThrow();
    }

    public ShiftVolunteerEntity markAttendance(Long shiftId, Long volunteerId, AttendanceStatus status, Integer workedHours) {
        ShiftVolunteerEntity entity = shiftVolunteerRepository.findById(new ShiftVolunteerId(shiftId, volunteerId))
                .orElseThrow(() -> new NoSuchElementException("Смена или волонтёр не найдены"));
        entity.setAttendanceStatus(status);
        if (status == AttendanceStatus.attended && entity.getSignedUpAt() == null) {
            entity.setSignedUpAt(OffsetDateTime.now());
        }
        if (workedHours != null) {
            entity.setWorkedHours(workedHours);
        }
        return shiftVolunteerRepository.save(entity);
    }

    public ShiftVolunteerEntity submitShift(Long shiftId, Long volunteerId, Integer workedHours) {
        ShiftVolunteerEntity entity = shiftVolunteerRepository.findById(new ShiftVolunteerId(shiftId, volunteerId))
                .orElseThrow(() -> new NoSuchElementException("Смена или волонтёр не найдены"));
        shiftRepository.findById(shiftId).ifPresent(shift -> {
            if (shift.getShiftDate() != null && shift.getShiftDate().isAfter(LocalDate.now())) {
                throw new IllegalStateException("Смена ещё не началась");
            }
        });
        if (entity.getAttendanceStatus() == AttendanceStatus.absent) {
            throw new IllegalStateException("Нельзя сдать смену со статусом 'отсутствовал'");
        }
        List<TaskShiftEntity> assignments = taskShiftRepository.findByIdShiftId(shiftId);
        boolean hasIncomplete = !assignments.isEmpty() && assignments.stream().anyMatch(t -> !"done".equalsIgnoreCase(t.getTaskState()));
        if (hasIncomplete) {
            throw new IllegalStateException("Закройте все задачи смены перед сдачей");
        }
        entity.setAttendanceStatus(AttendanceStatus.attended);
        OffsetDateTime now = OffsetDateTime.now();
        entity.setSubmittedAt(now);
        entity.setWorkedHours(resolveHours(shiftId, workedHours, entity, now));
        return shiftVolunteerRepository.save(entity);
    }

    public ShiftVolunteerEntity approveShift(Long shiftId, Long volunteerId, Integer workedHours, String feedback) {
        ShiftVolunteerEntity entity = shiftVolunteerRepository.findById(new ShiftVolunteerId(shiftId, volunteerId))
                .orElseThrow(() -> new NoSuchElementException("Смена или волонтёр не найдены"));
        entity.setAttendanceStatus(AttendanceStatus.attended);
        OffsetDateTime now = OffsetDateTime.now();
        entity.setApprovedAt(now);
        entity.setWorkedHours(resolveHours(shiftId, workedHours, entity, now));
        if (feedback != null) {
            entity.setVolunteerFeedback(feedback);
        }
        return shiftVolunteerRepository.save(entity);
    }

    public ShiftResponse closeShift(Long shiftId, Integer workedHoursOverride) {
        ShiftEntity shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new NoSuchElementException("Смена не найдена"));
        List<TaskShiftEntity> assignments = taskShiftRepository.findByIdShiftId(shiftId);
        int hours = workedHoursOverride != null ? workedHoursOverride : assignments.stream()
                .filter(t -> "done".equalsIgnoreCase(t.getTaskState()))
                .map(TaskShiftEntity::getWorkedHours)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();
        List<ShiftVolunteerEntity> vols = shiftVolunteerRepository.findByIdShiftId(shiftId);
        OffsetDateTime now = OffsetDateTime.now();
        for (ShiftVolunteerEntity v : vols) {
            if (v.getApprovedAt() != null) continue;
            v.setAttendanceStatus(AttendanceStatus.attended);
            v.setApprovedAt(now);
            v.setWorkedHours(hours);
        }
        shiftVolunteerRepository.saveAll(vols);
        return shiftMapper.toResponse(shift);
    }

    public List<VolunteerShiftResponse> getVolunteerShifts(Long volunteerId) {
        List<ShiftVolunteerEntity> signups = shiftVolunteerRepository.findByIdVolunteerId(volunteerId);
        if (signups.isEmpty()) {
            return List.of();
        }
        Set<Long> shiftIds = signups.stream()
                .map(s -> s.getId().getShiftId())
                .collect(Collectors.toSet());
        Map<Long, ShiftEntity> shiftMap = shiftRepository.findAllById(shiftIds).stream()
                .collect(Collectors.toMap(ShiftEntity::getId, Function.identity()));
        Map<Long, List<ShiftTaskView>> tasksByShift = tasksByShiftId(shiftIds);

        return signups.stream()
                .map(s -> {
                    Long sid = s.getId().getShiftId();
                    ShiftEntity shift = shiftMap.get(sid);
                    return new VolunteerShiftResponse(
                            sid,
                            shift != null ? shift.getShiftDate() : null,
                            shift != null ? shift.getShiftType() : ShiftType.full_day,
                            s.getAttendanceStatus(),
                            s.getWorkedHours(),
                            s.getSubmittedAt(),
                            s.getApprovedAt(),
                            s.getVolunteerFeedback(),
                            tasksByShift.getOrDefault(sid, List.of())
                    );
                })
                .sorted(Comparator.comparing(VolunteerShiftResponse::shiftDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private void refreshTaskStatus(Long taskId) {
        TaskEntity task = taskRepository.findById(taskId).orElse(null);
        if (task == null || task.getStatus() == TaskStatus.cancelled) {
            return;
        }
        List<TaskShiftEntity> assignments = taskShiftRepository.findByIdTaskId(taskId);
        TaskStatus nextStatus;
        if (assignments.isEmpty()) {
            nextStatus = TaskStatus.open;
        } else {
            boolean allDone = assignments.stream().allMatch(a -> "done".equalsIgnoreCase(a.getTaskState()));
            nextStatus = allDone ? TaskStatus.completed : TaskStatus.assigned;
        }
        if (task.getStatus() != nextStatus) {
            task.setStatus(nextStatus);
            taskRepository.save(task);
        }
    }

    private Map<Long, List<ShiftTaskView>> tasksByShiftId(Collection<Long> shiftIds) {
        List<TaskShiftEntity> assignments = taskShiftRepository.findByIdShiftIdIn(shiftIds);
        Map<Long, List<TaskShiftEntity>> byShift = assignments.stream()
                .collect(Collectors.groupingBy(a -> a.getId().getShiftId()));
        Map<Long, List<ShiftTaskView>> result = new java.util.HashMap<>();
        byShift.forEach((shiftId, items) -> result.put(shiftId, toViews(items)));
        return result;
    }

    private List<ShiftTaskView> toViews(List<TaskShiftEntity> assignments) {
        if (assignments == null || assignments.isEmpty()) {
            return List.of();
        }
        Set<Long> taskIds = assignments.stream()
                .map(a -> a.getId().getTaskId())
                .collect(Collectors.toSet());
        Set<Long> actorIds = assignments.stream()
                .map(TaskShiftEntity::getCompletedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, TaskEntity> taskMap = taskRepository.findAllById(taskIds).stream()
                .collect(Collectors.toMap(TaskEntity::getId, Function.identity()));
        Set<Long> animalIds = taskMap.values().stream()
                .map(TaskEntity::getAnimalId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, AnimalEntity> animalMap = animalRepository.findAllById(animalIds).stream()
                .collect(Collectors.toMap(AnimalEntity::getId, Function.identity()));
        Map<Long, String> actorNames = personRepository.findAllById(actorIds).stream()
                .collect(Collectors.toMap(PersonEntity::getId, p -> {
                    String name = ((p.getFirstName() != null ? p.getFirstName() : "") + " " + (p.getLastName() != null ? p.getLastName() : "")).trim();
                    if (name.isBlank()) {
                        name = "ID " + p.getId();
                    }
                    return name;
                }));

        return assignments.stream()
                .map(a -> {
                    TaskEntity task = taskMap.get(a.getId().getTaskId());
                    Long animalId = task != null ? task.getAnimalId() : null;
                    String animalName = animalId != null && animalMap.containsKey(animalId)
                            ? animalMap.get(animalId).getName()
                            : null;
                    Long actorId = a.getCompletedBy();
                    return new ShiftTaskView(
                            a.getId().getTaskId(),
                            a.getId().getShiftId(),
                            task != null ? task.getTitle() : ("Задача #" + a.getId().getTaskId()),
                            task != null ? task.getDescription() : null,
                            animalId,
                            animalName,
                            a.getProgressNotes(),
                            a.getTaskState(),
                            a.getCompletedAt(),
                            actorId,
                            actorId != null ? actorNames.get(actorId) : null,
                            a.getWorkedHours()
                    );
                })
                .toList();
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
