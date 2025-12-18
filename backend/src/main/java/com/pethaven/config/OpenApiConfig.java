package com.pethaven.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Pet Haven API",
                version = "1.0",
                description = "REST API /api/v1 для управления приютом Pet Haven"
        )
)
public class OpenApiConfig {
}
