package com.pethaven.service;

import com.pethaven.entity.NotificationEntity;
import com.pethaven.repository.NotificationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final Map<Long, List<WebSocketSession>> wsSessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public NotificationService(NotificationRepository notificationRepository, ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.objectMapper = objectMapper;
    }

    public List<NotificationEntity> getUserNotifications(Long personId) {
        return notificationRepository.findByPersonIdOrderByCreatedAtDesc(personId, PageRequest.of(0, 50));
    }

    public NotificationEntity push(Long personId, com.pethaven.model.enums.NotificationType type, String title, String message) {
        Long id = notificationRepository.createNotification(personId, type.name(), title, message);
        NotificationEntity entity = notificationRepository.findById(id).orElse(null);
        if (entity != null) {
            broadcast(entity);
        }
        return entity;
    }

    @Transactional
    public void markRead(Long personId, Long notificationId) {
        notificationRepository.markRead(notificationId, personId);
    }

    @Transactional
    public void markAllRead(Long personId) {
        notificationRepository.markAllRead(personId);
    }

    @Transactional
    public void deleteAll(Long personId) {
        notificationRepository.deleteAllByPersonId(personId);
    }

    public void registerSocket(Long personId, WebSocketSession session) {
        wsSessions.computeIfAbsent(personId, k -> new ArrayList<>()).add(session);
    }

    public void unregisterSocket(Long personId, WebSocketSession session) {
        List<WebSocketSession> list = wsSessions.get(personId);
        if (list != null) {
            list.remove(session);
            if (list.isEmpty()) {
                wsSessions.remove(personId);
            }
        }
    }

    private void broadcast(NotificationEntity notification) {
        List<WebSocketSession> sockets = wsSessions.get(notification.getPersonId());
        if (sockets != null) {
            List<WebSocketSession> closeList = new ArrayList<>();
            for (WebSocketSession session : sockets) {
                try {
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(notification)));
                } catch (IOException e) {
                    closeList.add(session);
                }
            }
            closeList.forEach(ws -> unregisterSocket(notification.getPersonId(), ws));
        }
    }
}
