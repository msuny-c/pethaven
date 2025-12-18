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
}
