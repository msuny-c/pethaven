package com.pethaven.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pethaven.model.enums.AnimalStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "animal")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnimalEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "animal_id")
    private Long id;

    private String name;
    private String species;
    private String breed;

    @Column(name = "age")
    private Integer ageMonths;

    @Column(name = "gender")
    private String gender;

    private String description;

    @Column(name = "behavior_notes")
    private String behaviorNotes;

    @Column(name = "medical_summary")
    private String medicalSummary;

    @Column(name = "vaccinated")
    private Boolean vaccinated;

    @Column(name = "sterilized")
    private Boolean sterilized;

    @Column(name = "microchipped")
    private Boolean microchipped;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "animal_status")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private AnimalStatus status = AnimalStatus.quarantine;

    @OneToMany(mappedBy = "animal", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<AnimalMediaEntity> media = new ArrayList<>();
}
