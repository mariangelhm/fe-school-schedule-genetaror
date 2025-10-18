package com.schoolscheduler.configservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI configServiceOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("Config Service API")
                .description("Manage dynamic configuration for the School Scheduler platform")
                .version("v1.0.0"));
    }
}
