package com.pethaven.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.pethaven.support.MediaLinkSupport;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "animal_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnimalMediaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "media_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id")
    @JsonIgnore
    private AnimalEntity animal;

    @Column(name = "storage_key")
    private String storageKey;

    private String description;

    @Column(name = "uploaded_at")
    private OffsetDateTime uploadedAt;

    @PrePersist
    void onCreate() {
        if (uploadedAt == null) {
            uploadedAt = OffsetDateTime.now();
        }
    }

    @JsonProperty("url")
    public String getUrl() {
        if (storageKey != null && getId() != null) {
            return MediaLinkSupport.build("/animals/" + getId());
        }
        return (getId() != null) ? MediaLinkSupport.build("/animals/" + getId()) : null;
    }
}
