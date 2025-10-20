package com.schoolscheduler.subjectservice.service;

import com.schoolscheduler.subjectservice.dto.SubjectDto;
import com.schoolscheduler.subjectservice.entity.Subject;
import com.schoolscheduler.subjectservice.repository.SubjectRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;

    public SubjectServiceImpl(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    @Override
    public List<SubjectDto> findAll() {
        return subjectRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public SubjectDto findById(Long id) {
        return subjectRepository.findById(id).map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Subject not found"));
    }

    @Override
    public SubjectDto create(SubjectDto subjectDto) {
        Subject subject = toEntity(subjectDto);
        subject.setId(null);
        return toDto(subjectRepository.save(subject));
    }

    @Override
    public SubjectDto update(Long id, SubjectDto subjectDto) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Subject not found"));
        subject.setName(subjectDto.name());
        subject.setLevel(subjectDto.level());
        subject.setWeeklyBlocks(subjectDto.weeklyBlocks());
        subject.setType(subjectDto.type());
        subject.setColor(subjectDto.color());
        return toDto(subjectRepository.save(subject));
    }

    @Override
    public void delete(Long id) {
        subjectRepository.deleteById(id);
    }

    private SubjectDto toDto(Subject subject) {
        return new SubjectDto(
                subject.getId(),
                subject.getName(),
                subject.getLevel(),
                subject.getWeeklyBlocks(),
                subject.getType(),
                subject.getColor()
        );
    }

    private Subject toEntity(SubjectDto dto) {
        Subject subject = new Subject();
        subject.setId(dto.id());
        subject.setName(dto.name());
        subject.setLevel(dto.level());
        subject.setWeeklyBlocks(dto.weeklyBlocks());
        subject.setType(dto.type());
        subject.setColor(dto.color());
        return subject;
    }
}
