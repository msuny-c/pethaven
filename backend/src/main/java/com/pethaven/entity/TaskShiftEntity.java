package com.pethaven.entity;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "task_shift")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaskShiftEntity {
    @EmbeddedId
    @JsonUnwrapped
    private TaskShiftId id;

    @Column(name = "progress_notes")
    private String progressNotes;

    @Column(name = "completed")
    private Boolean completed = Boolean.FALSE;

    @Column(name = "completed_at")
    private java.time.OffsetDateTime completedAt;

    @Column(name = "completed_by")
    private Long completedBy;

    @Column(name = "task_state")
    private String taskState = "open";

    @Column(name = "worked_hours")
    private Integer workedHours;

    @jakarta.persistence.PrePersist
    void onCreate() {
        if (completed == null) {
            completed = Boolean.FALSE;
        }
        if (taskState == null) {
            taskState = "open";
        }
    }
}
