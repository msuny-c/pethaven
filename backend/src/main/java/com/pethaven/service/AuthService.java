package com.pethaven.service;

import com.pethaven.dto.AuthResponse;
import com.pethaven.dto.LoginRequest;
import com.pethaven.dto.RegisterRequest;
import com.pethaven.entity.PersonEntity;
import com.pethaven.entity.RoleEntity;
import com.pethaven.repository.PersonRepository;
import com.pethaven.repository.RoleRepository;
import com.pethaven.security.JwtService;
import com.pethaven.model.enums.SystemRole;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final PersonRepository personRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(PersonRepository personRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       TokenService tokenService) {
        this.personRepository = personRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    public AuthResponse registerCandidate(RegisterRequest request) {
        String hash = passwordEncoder.encode(request.password());
        SystemRole targetRole = SystemRole.candidate;
        if (request.role() != null && !request.role().isBlank()) {
            try {
                targetRole = SystemRole.valueOf(request.role());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Некорректная роль регистрации");
            }
            if (targetRole != SystemRole.candidate && targetRole != SystemRole.volunteer) {
                throw new IllegalArgumentException("Регистрация доступна только для кандидатов или волонтеров");
            }
        }
        PersonEntity person = new PersonEntity();
        person.setEmail(request.email());
        person.setPasswordHash(hash);
        person.setFirstName(request.firstName());
        person.setLastName(request.lastName());
        person.setPhoneNumber(request.phone());
        person.setActive(true);
        person.setRoles(new HashSet<>());
        RoleEntity candidateRole = roleRepository.findByName(targetRole.name()).orElseThrow();
        person.getRoles().add(candidateRole);
        PersonEntity saved = personRepository.save(person);
        Set<SystemRole> roles = Set.of(targetRole);
        TokenService.TokenPair pair = tokenService.issueTokens(saved.getId(), saved.getEmail(), roles);
        return new AuthResponse(saved.getId(), saved.getEmail(), saved.getFirstName(), saved.getLastName(), saved.getPhoneNumber(),
                roles, pair.accessToken(), null, saved.getAvatarUrl());
    }

    public Optional<AuthResponse> login(LoginRequest request) {
        Optional<PersonEntity> personOpt = personRepository.findByEmail(request.email());
        if (personOpt.isEmpty()) {
            return Optional.empty();
        }
        PersonEntity person = personOpt.get();
        if (Boolean.FALSE.equals(person.getActive())) {
            return Optional.empty();
        }
        if (!passwordEncoder.matches(request.password(), person.getPasswordHash())) {
            return Optional.empty();
        }
        if (person.getRoles().isEmpty()) {
            return Optional.empty();
        }
        Set<SystemRole> roles = person.getRoles().stream()
                .map(RoleEntity::getName)
                .map(SystemRole::valueOf)
                .collect(Collectors.toSet());
        TokenService.TokenPair pair = tokenService.issueTokens(person.getId(), person.getEmail(), roles);
        return Optional.of(new AuthResponse(
                person.getId(),
                person.getEmail(),
                person.getFirstName(),
                person.getLastName(),
                person.getPhoneNumber(),
                roles,
                pair.accessToken(),
                null,
                person.getAvatarUrl()
        ));
    }
}
