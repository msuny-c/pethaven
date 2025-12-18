package com.pethaven.dto;

public record ApiMessage(String message) {
    public static ApiMessage of(String text) {
        return new ApiMessage(text);
    }
}
