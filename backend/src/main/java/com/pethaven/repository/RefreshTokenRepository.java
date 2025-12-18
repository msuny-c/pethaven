package com.pethaven.repository;

import com.pethaven.entity.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {
    Optional<RefreshTokenEntity> findByToken(String token);

    @Modifying
    @Query("delete from RefreshTokenEntity t where t.personId = :personId")
    void deleteByPersonId(Long personId);

    @Modifying
    @Query("update RefreshTokenEntity t set t.revoked = true where t.token = :token")
    void revoke(String token);

    @Modifying
    @Query("delete from RefreshTokenEntity t where t.expiresAt < :now")
    void deleteExpired(OffsetDateTime now);
}
