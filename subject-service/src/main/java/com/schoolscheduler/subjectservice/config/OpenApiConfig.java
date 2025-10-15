package com.schoolscheduler.subjectservice.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI subjectServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("Subject Service API")
                        .description("CRUD operations for school subjects")
                        .version("v1.0.0")
                        .license(new License().name("Apache 2.0")))
                .externalDocs(new ExternalDocumentation()
                        .description("School Scheduler documentation")
                        .url("https://example.com/docs"));
    }
}
