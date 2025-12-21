package com.pethaven.mapper;

import com.pethaven.dto.AnimalNoteResponse;
import com.pethaven.entity.AnimalNoteEntity;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AnimalNoteMapper {
    AnimalNoteResponse toResponse(AnimalNoteEntity entity);
    List<AnimalNoteResponse> toResponses(List<AnimalNoteEntity> entities);
}
