package com.schoolscheduler.teacherservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI teacherServiceOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("Teacher Service API")
                .description("CRUD operations and summaries for teachers")
                .version("v1.0.0"));
    }
}
