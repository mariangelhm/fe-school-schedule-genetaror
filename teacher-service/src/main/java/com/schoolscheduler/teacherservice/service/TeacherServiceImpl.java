package com.schoolscheduler.teacherservice.service;

import com.schoolscheduler.teacherservice.dto.TeacherDto;
import com.schoolscheduler.teacherservice.entity.Teacher;
import com.schoolscheduler.teacherservice.repository.TeacherRepository;
import com.schoolscheduler.teacherservice.service.model.TeacherSummary;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;

    public TeacherServiceImpl(TeacherRepository teacherRepository) {
        this.teacherRepository = teacherRepository;
    }

    @Override
    public List<TeacherDto> findAll() {
        return teacherRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public TeacherDto findById(Long id) {
        return teacherRepository.findById(id).map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));
    }

    @Override
    public TeacherDto create(TeacherDto dto) {
        Teacher teacher = toEntity(dto);
        teacher.setId(null);
        return toDto(teacherRepository.save(teacher));
    }

    @Override
    public TeacherDto update(Long id, TeacherDto dto) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));
        teacher.setName(dto.name());
        teacher.setContractType(dto.contractType());
        teacher.setWeeklyHours(dto.weeklyHours());
        teacher.setSubjectIds(dto.subjectIds());
        teacher.setAvailableBlocks(dto.availableBlocks());
        return toDto(teacherRepository.save(teacher));
    }

    @Override
    public void delete(Long id) {
        teacherRepository.deleteById(id);
    }

    @Override
    public TeacherSummary summary(Long id) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found"));
        int assignedBlocks = teacher.getWeeklyHours();
        int availableBlocks = teacher.getAvailableBlocks() != null ? teacher.getAvailableBlocks().size() : 0;
        return new TeacherSummary(teacher.getId(), assignedBlocks, availableBlocks);
    }

    private TeacherDto toDto(Teacher teacher) {
        return new TeacherDto(
                teacher.getId(),
                teacher.getName(),
                teacher.getContractType(),
                teacher.getWeeklyHours(),
                teacher.getSubjectIds(),
                teacher.getAvailableBlocks()
        );
    }

    private Teacher toEntity(TeacherDto dto) {
        Teacher teacher = new Teacher();
        teacher.setId(dto.id());
        teacher.setName(dto.name());
        teacher.setContractType(dto.contractType());
        teacher.setWeeklyHours(dto.weeklyHours());
        teacher.setSubjectIds(dto.subjectIds());
        teacher.setAvailableBlocks(dto.availableBlocks());
        return teacher;
    }
}
