package com.pethaven.service;

import com.pethaven.entity.SystemSettingEntity;
import com.pethaven.repository.SystemSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class SettingService {
    public static final String REPORT_INTERVAL_DAYS = "report_interval_days"; // legacy, fallback
    public static final String REPORT_OFFSET_DAYS = "report_offset_days";
    public static final String REPORT_FILL_DAYS = "report_fill_days";
    public static final String VACCINATION_INTERVAL_DAYS = "vaccination_interval_days";

    private final SystemSettingRepository repository;

    public SettingService(SystemSettingRepository repository) {
        this.repository = repository;
    }

    public int getInt(String key, int defaultValue) {
        return parseInt(repository.findById(key).map(SystemSettingEntity::getValue), defaultValue);
    }

    public String get(String key, String defaultValue) {
        return repository.findById(key).map(SystemSettingEntity::getValue).orElse(defaultValue);
    }

    @Transactional
    public void set(String key, String value) {
        SystemSettingEntity entity = repository.findById(key).orElseGet(SystemSettingEntity::new);
        entity.setKey(key);
        entity.setValue(value);
        repository.save(entity);
    }

    public void setInt(String key, int value) {
        set(key, Integer.toString(value));
    }

    public int getReportOffsetDays() {
        return getInt(REPORT_OFFSET_DAYS, getInt(REPORT_INTERVAL_DAYS, 30));
    }

    public int getReportFillDays() {
        return Math.max(1, getInt(REPORT_FILL_DAYS, 7));
    }

    private int parseInt(Optional<String> val, int defaultValue) {
        if (val.isEmpty()) return defaultValue;
        try {
            return Integer.parseInt(val.get());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
