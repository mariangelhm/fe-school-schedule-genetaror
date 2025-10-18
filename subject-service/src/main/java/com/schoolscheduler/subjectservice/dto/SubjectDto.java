package com.schoolscheduler.subjectservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SubjectDto(
        Long id,
        @NotBlank(message = "Name is required") String name,
        @NotBlank(message = "Level is required") String level,
        @NotNull(message = "Weekly blocks are required") @Min(1) Integer weeklyBlocks,
        @NotBlank(message = "Type is required") String type,
        String color
) {
}
