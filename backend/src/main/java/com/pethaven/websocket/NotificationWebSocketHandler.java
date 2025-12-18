package com.pethaven.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pethaven.security.JwtService;
import com.pethaven.service.NotificationService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.Map;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final JwtService jwtService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public NotificationWebSocketHandler(JwtService jwtService,
                                        NotificationService notificationService,
                                        ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = extractUserId(session);
        if (userId == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Invalid token"));
            return;
        }
        session.getAttributes().put("uid", userId);
        notificationService.registerSocket(userId, session);
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of("type", "connected"))));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Object uid = session.getAttributes().get("uid");
        if (uid instanceof Long userId) {
            notificationService.unregisterSocket(userId, session);
        }
    }

    private Long extractUserId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) {
            return null;
        }
        String query = uri.getQuery();
        if (query == null) {
            return null;
        }
        for (String part : query.split("&")) {
            String[] kv = part.split("=");
            if (kv.length == 2 && kv[0].equals("token")) {
                String token = kv[1];
                if (jwtService.isValid(token)) {
                    return jwtService.toAuthentication(token).getPrincipal() instanceof Long uid ? uid : null;
                }
            }
        }
        return null;
    }
}
