package com.pethaven.mapper;

import com.pethaven.dto.MedicalRecordRequest;
import com.pethaven.dto.MedicalRecordResponse;
import com.pethaven.entity.MedicalRecordEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MedicalRecordMapper {

    @Mapping(target = "vetFirstName", ignore = true)
    @Mapping(target = "vetLastName", ignore = true)
    MedicalRecordResponse toResponse(MedicalRecordEntity entity);

    List<MedicalRecordResponse> toResponses(List<MedicalRecordEntity> entities);

    @Mapping(target = "id", ignore = true)
    MedicalRecordEntity toEntity(MedicalRecordRequest request);
}
