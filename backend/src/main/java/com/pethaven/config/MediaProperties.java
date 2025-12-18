package com.pethaven.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "media")
public class MediaProperties {
    /**
     * Базовый префикс для прокси-выдачи медиа (по умолчанию /api/v1/media).
     */
    private String proxyBase = "/api/v1/media";

    public String getProxyBase() {
        return proxyBase;
    }

    public void setProxyBase(String proxyBase) {
        this.proxyBase = proxyBase;
    }
}
