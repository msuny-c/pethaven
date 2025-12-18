package com.pethaven.controller;

import com.pethaven.entity.TaskEntity;
import com.pethaven.repository.TaskRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskRepository taskRepository;

    public TaskController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @GetMapping
    public List<TaskEntity> list() {
        return taskRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<TaskEntity> create(@RequestBody TaskEntity task) {
        TaskEntity saved = taskRepository.save(task);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TaskEntity> update(@PathVariable Long id, @RequestBody TaskEntity payload) {
        TaskEntity task = taskRepository.findById(id).orElseThrow();
        if (payload.getStatus() != null) {
            task.setStatus(payload.getStatus());
        }
        if (payload.getDescription() != null) {
            task.setDescription(payload.getDescription());
        }
        if (payload.getDueDate() != null) {
            task.setDueDate(payload.getDueDate());
        }
        if (payload.getEstimatedShifts() != null) {
            task.setEstimatedShifts(payload.getEstimatedShifts());
        }
        return ResponseEntity.ok(taskRepository.save(task));
    }
}
