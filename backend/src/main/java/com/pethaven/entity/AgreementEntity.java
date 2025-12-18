package com.pethaven.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "agreement")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AgreementEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "agreement_id")
    private Long id;

    @Column(name = "application_id")
    private Long applicationId;

    @Column(name = "signed_date")
    private LocalDate signedDate;

    @Column(name = "post_adoption_plan")
    private String postAdoptionPlan;
}
