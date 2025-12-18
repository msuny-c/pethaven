package com.pethaven.model.enums;

public enum SystemRole {
    admin,
    coordinator,
    volunteer,
    candidate,
    veterinar;

    public String asAuthority() {
        return "ROLE_" + name().toUpperCase();
    }
}
