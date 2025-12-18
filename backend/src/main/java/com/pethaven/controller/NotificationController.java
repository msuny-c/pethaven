package com.pethaven.controller;

import com.pethaven.entity.NotificationEntity;
import com.pethaven.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/me")
    public ResponseEntity<List<NotificationEntity>> myNotifications(Authentication authentication) {
        Long uid = currentUser(authentication);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(notificationService.getUserNotifications(uid));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id, Authentication authentication) {
        Long uid = currentUser(authentication);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        notificationService.markRead(uid, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication authentication) {
        Long uid = currentUser(authentication);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        notificationService.markAllRead(uid);
        return ResponseEntity.noContent().build();
    }

    private Long currentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long uid)) {
            return null;
        }
        return uid;
    }
}
