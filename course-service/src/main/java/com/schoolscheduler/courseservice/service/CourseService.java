package com.schoolscheduler.courseservice.service;

import com.schoolscheduler.courseservice.dto.CourseDto;
import com.schoolscheduler.courseservice.service.model.CourseScheduleSlot;
import java.util.List;

public interface CourseService {
    List<CourseDto> findAll();

    CourseDto findById(Long id);

    CourseDto create(CourseDto dto);

    CourseDto update(Long id, CourseDto dto);

    void delete(Long id);

    List<CourseScheduleSlot> schedule(Long id);
}
