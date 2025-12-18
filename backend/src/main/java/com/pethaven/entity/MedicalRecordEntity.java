package com.pethaven.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "medical_record")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "record_id")
    private Long id;

    @Column(name = "animal_id")
    private Long animalId;

    @Column(name = "vet_id")
    private Long vetId;

    private String procedure;
    private String description;

    @Column(name = "administered_date")
    private LocalDate administeredDate;

    @Column(name = "next_due_date")
    private LocalDate nextDueDate;
}
