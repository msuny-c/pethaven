package com.pethaven.service;

import com.pethaven.entity.PersonEntity;
import com.pethaven.entity.RoleEntity;
import com.pethaven.repository.RoleRepository;
import com.pethaven.repository.PersonRepository;
import com.pethaven.model.enums.SystemRole;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PersonService {

    private final PersonRepository personRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public PersonService(PersonRepository personRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.personRepository = personRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<PersonEntity> findAll() {
        return personRepository.findAll();
    }

    public List<PersonEntity> findAllExcept(Long excludeId) {
        List<PersonEntity> all = personRepository.findAll();
        if (excludeId == null) {
            return all;
        }
        return all.stream()
                .filter(p -> !excludeId.equals(p.getId()))
                .toList();
    }

    @Transactional
    public PersonEntity createUser(String email,
                                   String rawPassword,
                                   String firstName,
                                   String lastName,
                                   String phone,
                                   Set<SystemRole> roles) {
        if (personRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Пользователь с таким email уже существует");
        }
        PersonEntity entity = new PersonEntity();
        entity.setEmail(email);
        entity.setPasswordHash(passwordEncoder.encode(rawPassword));
        entity.setFirstName(firstName);
        entity.setLastName(lastName);
        entity.setPhoneNumber(phone);
        entity.setActive(true);
        Set<RoleEntity> roleEntities = roles.stream()
                .map(r -> roleRepository.findByName(r.name()).orElseThrow())
                .collect(Collectors.toSet());
        entity.setRoles(roleEntities);
        return personRepository.save(entity);
    }

    @Transactional
    public PersonEntity updateRoles(Long personId, Set<SystemRole> roles) {
        PersonEntity person = personRepository.findById(personId).orElseThrow();
        person.getRoles().clear();
        roles.forEach(r -> {
            RoleEntity role = roleRepository.findByName(r.name()).orElseThrow();
            person.getRoles().add(role);
        });
        return personRepository.save(person);
    }

    @Transactional
    public PersonEntity updateActive(Long personId, boolean active) {
        PersonEntity person = personRepository.findById(personId).orElseThrow();
        person.setActive(active);
        return personRepository.save(person);
    }

    @Transactional
    public PersonEntity updateAvatar(Long personId, String avatarKey) {
        PersonEntity person = personRepository.findById(personId).orElseThrow();
        person.setAvatarKey(avatarKey);
        person.setAvatarUrl(null);
        return personRepository.save(person);
    }

    @Transactional
    public PersonEntity updateProfile(Long personId, String firstName, String lastName, String phoneNumber) {
        PersonEntity person = personRepository.findById(personId).orElseThrow();
        if (firstName != null) {
            person.setFirstName(firstName);
        }
        if (lastName != null) {
            person.setLastName(lastName);
        }
        if (phoneNumber != null) {
            person.setPhoneNumber(phoneNumber);
        }
        return personRepository.save(person);
    }

    public void delete(Long personId) {
        personRepository.deleteById(personId);
    }

    @Transactional
    public boolean deactivateSelf(Long personId, String rawPassword) {
        PersonEntity person = personRepository.findById(personId).orElseThrow();
        if (!passwordEncoder.matches(rawPassword, person.getPasswordHash())) {
            return false;
        }
        person.setActive(false);
        personRepository.save(person);
        return true;
    }
}
