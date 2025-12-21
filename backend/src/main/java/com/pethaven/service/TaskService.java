package com.pethaven.service;

import com.pethaven.dto.TaskCreateRequest;
import com.pethaven.dto.TaskResponse;
import com.pethaven.dto.TaskUpdateRequest;
import com.pethaven.entity.TaskEntity;
import com.pethaven.mapper.TaskMapper;
import com.pethaven.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;

    public TaskService(TaskRepository taskRepository, TaskMapper taskMapper) {
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
    }

    public List<TaskResponse> list() {
        return taskMapper.toResponses(taskRepository.findAll());
    }

    public TaskResponse create(TaskCreateRequest request) {
        TaskEntity entity = taskMapper.toEntity(request);
        if (entity.getStatus() == null) {
            entity.setStatus(com.pethaven.model.enums.TaskStatus.open);
        }
        return taskMapper.toResponse(taskRepository.save(entity));
    }

    public TaskResponse update(Long id, TaskUpdateRequest request) {
        TaskEntity task = taskRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Task not found: " + id));
        taskMapper.update(task, request);
        if (task.getStatus() == null) {
            task.setStatus(com.pethaven.model.enums.TaskStatus.open);
        }
        return taskMapper.toResponse(taskRepository.save(task));
    }
}
