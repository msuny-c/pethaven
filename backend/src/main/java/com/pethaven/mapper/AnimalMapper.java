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

@Mapper(componentModel = "spring")
public interface AnimalMapper {

    AnimalResponse toResponse(AnimalEntity entity);

    List<AnimalResponse> toResponses(List<AnimalEntity> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "media", ignore = true)
    @Mapping(target = "pendingAdminReview", ignore = true)
    @Mapping(target = "readyForAdoption", ignore = true)
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
        if (entity.getReadyForAdoption() == null) {
            entity.setReadyForAdoption(Boolean.FALSE);
        }
    }
}
