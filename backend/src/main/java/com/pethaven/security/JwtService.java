package com.pethaven.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class JwtService {

    private final Key signingKey;
    private final long ttlSeconds;

    public JwtService(@Value("${security.jwt.secret:changeme-secret-key}") String secret,
                      @Value("${security.jwt.ttl-seconds:86400}") long ttlSeconds) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            this.signingKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        } else {
            this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        }
        this.ttlSeconds = ttlSeconds;
    }

    public String generateToken(Long userId, String email, Set<com.pethaven.model.enums.SystemRole> roles) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(email)
                .claim("uid", userId)
                .claim("roles", roles.stream().map(Enum::name).toList())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(ttlSeconds)))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public UsernamePasswordAuthenticationToken toAuthentication(String token) {
        Claims claims = parseClaims(token);
        Long userId = claims.get("uid", Integer.class).longValue();
        @SuppressWarnings("unchecked")
        Set<com.pethaven.model.enums.SystemRole> roles = ((java.util.List<String>) claims.get("roles")).stream()
                .map(com.pethaven.model.enums.SystemRole::valueOf)
                .collect(Collectors.toSet());
        var authorities = roles.stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.name().toUpperCase()))
                .collect(Collectors.toList());
        return new UsernamePasswordAuthenticationToken(userId, token, authorities);
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
