package com.pethaven.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ShiftVolunteerId implements Serializable {

    @Column(name = "shift_id")
    private Long shiftId;

    @Column(name = "volunteer_id")
    private Long volunteerId;
}
