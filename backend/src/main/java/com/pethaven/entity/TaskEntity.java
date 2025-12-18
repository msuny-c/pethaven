package com.pethaven.entity;

import com.pethaven.model.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "task")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaskEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "task_id")
    private Long id;

    private String title;
    private String description;

    @Column(name = "animal_id")
    private Long animalId;

    @Enumerated(EnumType.STRING)
    private TaskStatus status;

    @Column(name = "estimated_shifts")
    private Integer estimatedShifts;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (status == null) {
            status = com.pethaven.model.enums.TaskStatus.open;
        }
        if (estimatedShifts == null) {
            estimatedShifts = 1;
        }
        if (updatedAt == null) {
            updatedAt = OffsetDateTime.now();
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
