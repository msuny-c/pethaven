package com.pethaven.dto;

import com.pethaven.model.enums.AnimalStatus;

import java.util.List;

public record AnimalResponse(
        Long id,
        String name,
        String species,
        String breed,
        Integer ageMonths,
        String gender,
        String description,
        AnimalStatus status,
        Boolean pendingAdminReview,
        String adminReviewComment,
        Boolean readyForAdoption,
        List<String> photos
) {
}
