package com.schoolscheduler.courseservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CourseDto(
        Long id,
        @NotBlank String name,
        @NotBlank String level,
        Long headTeacherId,
        @NotNull @Min(0) Integer studentCount
) {
}
