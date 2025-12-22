package com.pethaven.mapper;

import com.pethaven.dto.AdoptionApplicationResponse;
import com.pethaven.dto.AgreementResponse;
import com.pethaven.dto.InterviewResponse;
import com.pethaven.entity.AdoptionApplicationEntity;
import com.pethaven.entity.AgreementEntity;
import com.pethaven.entity.InterviewEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AdoptionMapper {

    @Mapping(target = "passportUrl", expression = "java(passportUrl(entity))")
    AdoptionApplicationResponse toApplicationResponse(AdoptionApplicationEntity entity);

    List<AdoptionApplicationResponse> toApplicationResponses(List<AdoptionApplicationEntity> entities);

    InterviewResponse toInterviewResponse(InterviewEntity entity);

    List<InterviewResponse> toInterviewResponses(List<InterviewEntity> entities);

    @Mapping(target = "templateUrl", expression = "java(templateUrl(entity))")
    @Mapping(target = "signedUrl", expression = "java(signedUrl(entity))")
    AgreementResponse toAgreementResponse(AgreementEntity entity);

    List<AgreementResponse> toAgreementResponses(List<AgreementEntity> entities);

    default String passportUrl(AdoptionApplicationEntity entity) {
        if (entity == null || entity.getPassportKey() == null) {
            return null;
        }
        return "/api/v1/adoptions/applications/" + entity.getId() + "/passport";
    }

    default String templateUrl(AgreementEntity agreement) {
        if (agreement == null || agreement.getTemplateStorageKey() == null) {
            return null;
        }
        return "/api/v1/adoptions/agreements/" + agreement.getId() + "/template";
    }

    default String signedUrl(AgreementEntity agreement) {
        if (agreement == null || agreement.getSignedStorageKey() == null) {
            return null;
        }
        return "/api/v1/adoptions/agreements/" + agreement.getId() + "/signed";
    }
}
