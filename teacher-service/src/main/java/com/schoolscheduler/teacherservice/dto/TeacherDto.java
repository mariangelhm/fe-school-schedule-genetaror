package com.schoolscheduler.teacherservice.dto;

import com.schoolscheduler.teacherservice.entity.Teacher;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Set;

public record TeacherDto(
        Long id,
        @NotBlank String name,
        @NotNull Teacher.ContractType contractType,
        @NotNull @Min(1) Integer weeklyHours,
        Set<Long> subjectIds,
        Set<String> availableBlocks
) {
}
