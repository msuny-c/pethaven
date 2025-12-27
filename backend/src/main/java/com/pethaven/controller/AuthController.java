package com.pethaven.controller;

import com.pethaven.dto.ApiMessage;
import com.pethaven.dto.AuthResponse;
import com.pethaven.dto.LoginRequest;
import com.pethaven.dto.RegisterRequest;
import com.pethaven.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.registerCandidate(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiMessage.of(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        AuthService.LoginResult result = authService.login(request);
        if (result.auth() != null) {
            return ResponseEntity.ok(result.auth());
        }
        int status = result.blocked() ? 403 : 401;
        return ResponseEntity.status(status).body(ApiMessage.of(result.error() != null ? result.error() : "Неверные учетные данные"));
    }

}
