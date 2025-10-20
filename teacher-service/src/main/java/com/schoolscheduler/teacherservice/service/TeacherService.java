package com.schoolscheduler.teacherservice.service;

import com.schoolscheduler.teacherservice.dto.TeacherDto;
import com.schoolscheduler.teacherservice.service.model.TeacherSummary;
import java.util.List;

public interface TeacherService {
    List<TeacherDto> findAll();

    TeacherDto findById(Long id);

    TeacherDto create(TeacherDto dto);

    TeacherDto update(Long id, TeacherDto dto);

    void delete(Long id);

    TeacherSummary summary(Long id);
}
