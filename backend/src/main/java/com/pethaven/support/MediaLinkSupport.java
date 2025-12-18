package com.pethaven.support;

public final class MediaLinkSupport {
    private static volatile String base = "/api/v1/media";

    private MediaLinkSupport() {
    }

    public static void setBase(String basePath) {
        if (basePath != null && !basePath.isBlank()) {
            base = basePath.endsWith("/") ? basePath.substring(0, basePath.length() - 1) : basePath;
        }
    }

    public static String build(String suffix) {
        String cleanSuffix = suffix.startsWith("/") ? suffix : "/" + suffix;
        return base + cleanSuffix;
    }
}
