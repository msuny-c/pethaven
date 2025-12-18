package com.pethaven.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "refresh_token")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "token_id")
    private Long id;

    @Column(name = "person_id")
    private Long personId;

    @Column(name = "token", unique = true, nullable = false)
    private String token;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "revoked")
    private Boolean revoked = false;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (revoked == null) {
            revoked = false;
        }
    }
}
