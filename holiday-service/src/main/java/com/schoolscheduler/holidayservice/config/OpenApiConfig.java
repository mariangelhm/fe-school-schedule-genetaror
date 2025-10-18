package com.schoolscheduler.holidayservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI holidayServiceOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("Holiday Service API")
                .description("Manage school holidays")
                .version("v1.0.0"));
    }
}
