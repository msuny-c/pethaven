package com.pethaven.service;

import com.pethaven.entity.RefreshTokenEntity;
import com.pethaven.model.enums.SystemRole;
import com.pethaven.repository.RefreshTokenRepository;
import com.pethaven.security.JwtService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

@Service
public class TokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final long refreshTtlSeconds = 7 * 24 * 3600;

    public TokenService(RefreshTokenRepository refreshTokenRepository, JwtService jwtService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public TokenPair issueTokens(Long personId, String email, Set<SystemRole> roles) {
        refreshTokenRepository.deleteExpired(OffsetDateTime.now());
        String refresh = UUID.randomUUID().toString();
        RefreshTokenEntity entity = new RefreshTokenEntity();
        entity.setPersonId(personId);
        entity.setToken(refresh);
        entity.setExpiresAt(OffsetDateTime.now().plusSeconds(refreshTtlSeconds));
        refreshTokenRepository.save(entity);

        String access = jwtService.generateToken(personId, email, roles);
        return new TokenPair(access, refresh);
    }

    @Transactional
    public TokenPair refresh(String refreshToken, String email, Set<SystemRole> roles, Long personId) {
        RefreshTokenEntity token = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("Некорректный refresh токен"));
        if (Boolean.TRUE.equals(token.getRevoked()) || token.getExpiresAt().isBefore(OffsetDateTime.now())) {
            refreshTokenRepository.revoke(refreshToken);
            throw new IllegalArgumentException("Refresh токен недействителен");
        }
        if (!token.getPersonId().equals(personId)) {
            throw new IllegalArgumentException("Refresh токен не принадлежит пользователю");
        }
        refreshTokenRepository.revoke(refreshToken);
        return issueTokens(personId, email, roles);
    }

    public record TokenPair(String accessToken, String refreshToken) {
    }
}
