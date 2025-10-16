package com.schoolscheduler.configservice.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfigDto(Long id, @NotBlank String key, @NotBlank String value) {
}
