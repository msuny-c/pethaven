package com.pethaven.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "system_setting")
@Getter
@Setter
@NoArgsConstructor
public class SystemSettingEntity {
    @Id
    @Column(name = "key")
    private String key;

    @Column(name = "value")
    private String value;
}
