package com.pethaven.mapper;

import com.pethaven.dto.AnimalCreateRequest;
import com.pethaven.dto.AnimalMediaResponse;
import com.pethaven.dto.AnimalMedicalUpdateRequest;
import com.pethaven.dto.AnimalResponse;
import com.pethaven.dto.AnimalUpdateRequest;
import com.pethaven.entity.AnimalEntity;
import com.pethaven.entity.AnimalMediaEntity;
import org.mapstruct.AfterMapping;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;
import java.util.Comparator;

@Mapper(componentModel = "spring")
public interface AnimalMapper {

    @Mapping(target = "photos", expression = "java(mapMediaToUrls(entity))")
    AnimalResponse toResponse(AnimalEntity entity);

    List<AnimalResponse> toResponses(List<AnimalEntity> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "media", ignore = true)
    @Mapping(target = "pendingAdminReview", ignore = true)
    @Mapping(target = "readyForAdoption", ignore = true)
    @Mapping(target = "adminReviewComment", ignore = true)
    AnimalEntity toEntity(AnimalCreateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "media", ignore = true)
    void update(@MappingTarget AnimalEntity entity, AnimalUpdateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "media", ignore = true)
    void updateMedical(@MappingTarget AnimalEntity entity, AnimalMedicalUpdateRequest request);

    @Mapping(target = "url", expression = "java(entity.getUrl())")
    AnimalMediaResponse toMediaResponse(AnimalMediaEntity entity);

    List<AnimalMediaResponse> toMediaResponses(List<AnimalMediaEntity> entities);

    @AfterMapping
    default void ensurePendingReview(@MappingTarget AnimalEntity entity) {
        if (entity.getPendingAdminReview() == null) {
            entity.setPendingAdminReview(Boolean.TRUE);
        }
    }

    default List<String> mapMediaToUrls(AnimalEntity entity) {
        if (entity == null || entity.getMedia() == null) {
            return List.of();
        }
        return entity.getMedia().stream()
                .sorted(Comparator.comparing(AnimalMediaEntity::getUploadedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(AnimalMediaEntity::getUrl)
                .toList();
    }

}
