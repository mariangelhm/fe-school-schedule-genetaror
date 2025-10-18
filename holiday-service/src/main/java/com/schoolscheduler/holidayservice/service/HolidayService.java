package com.schoolscheduler.holidayservice.service;

import com.schoolscheduler.holidayservice.dto.HolidayDto;
import java.time.LocalDate;
import java.util.List;

public interface HolidayService {
    List<HolidayDto> findAll();

    HolidayDto findById(Long id);

    HolidayDto create(HolidayDto dto);

    HolidayDto update(Long id, HolidayDto dto);

    void delete(Long id);

    boolean isHoliday(LocalDate date);
}
