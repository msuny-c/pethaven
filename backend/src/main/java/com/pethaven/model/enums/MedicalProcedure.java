package com.pethaven.model.enums;

public enum MedicalProcedure {
    vaccination("Вакцинация выполнена"),
    sterilization("Стерилизация выполнена"),
    microchip("Чип установлен");

    private final String description;

    MedicalProcedure(String description) {
        this.description = description;
    }

    public String defaultDescription() {
        return description;
    }
}
