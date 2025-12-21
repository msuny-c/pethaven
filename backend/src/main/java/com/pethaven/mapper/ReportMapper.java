package com.pethaven.mapper;

import com.pethaven.dto.PostAdoptionReportResponse;
import com.pethaven.dto.ReportMediaResponse;
import com.pethaven.entity.PostAdoptionReportEntity;
import com.pethaven.entity.ReportMediaEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ReportMapper {

    PostAdoptionReportResponse toResponse(PostAdoptionReportEntity entity);

    List<PostAdoptionReportResponse> toResponses(List<PostAdoptionReportEntity> entities);

    @Mapping(target = "url", expression = "java(entity.getUrl())")
    ReportMediaResponse toMediaResponse(ReportMediaEntity entity);

    List<ReportMediaResponse> toMediaResponses(List<ReportMediaEntity> entities);
}
