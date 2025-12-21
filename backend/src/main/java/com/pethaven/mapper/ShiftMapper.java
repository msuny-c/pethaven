package com.pethaven.mapper;

import com.pethaven.dto.ShiftCreateRequest;
import com.pethaven.dto.ShiftResponse;
import com.pethaven.entity.ShiftEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ShiftMapper {

    ShiftResponse toResponse(ShiftEntity entity);

    List<ShiftResponse> toResponses(List<ShiftEntity> entities);

    @Mapping(target = "id", ignore = true)
    ShiftEntity toEntity(ShiftCreateRequest request);
}
