package com.pethaven.controller;

import com.pethaven.dto.ApiMessage;
import com.pethaven.service.SettingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingController {

    private final SettingService settingService;

    public SettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping("/{key}")
    public Map<String, String> get(@PathVariable String key) {
        return Map.of("key", key, "value", settingService.get(key, ""));
    }

    @PostMapping("/{key}")
    public ResponseEntity<ApiMessage> set(@PathVariable String key, @RequestBody Map<String, String> payload) {
        String value = payload.get("value");
        if (value == null) {
            return ResponseEntity.badRequest().body(ApiMessage.of("value is required"));
        }
        settingService.set(key, value);
        return ResponseEntity.ok(ApiMessage.of("Сохранено"));
    }
}
