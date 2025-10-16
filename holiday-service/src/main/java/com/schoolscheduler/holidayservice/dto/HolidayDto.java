package com.schoolscheduler.holidayservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record HolidayDto(Long id, @NotNull LocalDate date, @NotBlank String description) {
}
