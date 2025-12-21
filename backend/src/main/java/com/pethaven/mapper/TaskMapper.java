package com.pethaven.mapper;

import com.pethaven.dto.TaskCreateRequest;
import com.pethaven.dto.TaskResponse;
import com.pethaven.dto.TaskUpdateRequest;
import com.pethaven.entity.TaskEntity;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TaskMapper {

    TaskResponse toResponse(TaskEntity entity);

    List<TaskResponse> toResponses(List<TaskEntity> entities);

    @Mapping(target = "id", ignore = true)
    TaskEntity toEntity(TaskCreateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void update(@MappingTarget TaskEntity entity, TaskUpdateRequest request);
}
