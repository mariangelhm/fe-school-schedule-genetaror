package com.schoolscheduler.subjectservice.service;

import com.schoolscheduler.subjectservice.dto.SubjectDto;
import java.util.List;

public interface SubjectService {
    List<SubjectDto> findAll();

    SubjectDto findById(Long id);

    SubjectDto create(SubjectDto subjectDto);

    SubjectDto update(Long id, SubjectDto subjectDto);

    void delete(Long id);
}
