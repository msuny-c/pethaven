package com.pethaven.service;

import com.pethaven.model.enums.SystemRole;
import com.pethaven.security.JwtService;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class TokenService {

    private final JwtService jwtService;

    public TokenService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public TokenPair issueTokens(Long personId, String email, Set<SystemRole> roles) {
        String access = jwtService.generateToken(personId, email, roles);
        return new TokenPair(access);
    }

    public record TokenPair(String accessToken) {
    }
}
