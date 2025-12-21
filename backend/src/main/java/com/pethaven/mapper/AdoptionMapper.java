package com.pethaven.mapper;

import com.pethaven.dto.AdoptionApplicationResponse;
import com.pethaven.dto.AgreementResponse;
import com.pethaven.dto.InterviewResponse;
import com.pethaven.entity.AdoptionApplicationEntity;
import com.pethaven.entity.AgreementEntity;
import com.pethaven.entity.InterviewEntity;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AdoptionMapper {

    AdoptionApplicationResponse toApplicationResponse(AdoptionApplicationEntity entity);

    List<AdoptionApplicationResponse> toApplicationResponses(List<AdoptionApplicationEntity> entities);

    InterviewResponse toInterviewResponse(InterviewEntity entity);

    List<InterviewResponse> toInterviewResponses(List<InterviewEntity> entities);

    AgreementResponse toAgreementResponse(AgreementEntity entity);

    List<AgreementResponse> toAgreementResponses(List<AgreementEntity> entities);
}
