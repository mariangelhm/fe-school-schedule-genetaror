package com.schoolscheduler.courseservice.service;

import com.schoolscheduler.courseservice.dto.CourseDto;
import com.schoolscheduler.courseservice.entity.Course;
import com.schoolscheduler.courseservice.repository.CourseRepository;
import com.schoolscheduler.courseservice.service.model.CourseScheduleSlot;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;

    public CourseServiceImpl(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Override
    public List<CourseDto> findAll() {
        return courseRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public CourseDto findById(Long id) {
        return courseRepository.findById(id).map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Course not found"));
    }

    @Override
    public CourseDto create(CourseDto dto) {
        Course course = toEntity(dto);
        course.setId(null);
        return toDto(courseRepository.save(course));
    }

    @Override
    public CourseDto update(Long id, CourseDto dto) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Course not found"));
        course.setName(dto.name());
        course.setLevel(dto.level());
        course.setHeadTeacherId(dto.headTeacherId());
        course.setStudentCount(dto.studentCount());
        return toDto(courseRepository.save(course));
    }

    @Override
    public void delete(Long id) {
        courseRepository.deleteById(id);
    }

    @Override
    public List<CourseScheduleSlot> schedule(Long id) {
        // Placeholder implementation. Real implementation will call schedule-service.
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Course not found"));
        return List.of(new CourseScheduleSlot(LocalDate.now(), 1, "Matemáticas", "Profesor Demo"),
                new CourseScheduleSlot(LocalDate.now(), 2, "Lenguaje", "Profesora Demo"));
    }

    private CourseDto toDto(Course course) {
        return new CourseDto(course.getId(), course.getName(), course.getLevel(),
                course.getHeadTeacherId(), course.getStudentCount());
    }

    private Course toEntity(CourseDto dto) {
        Course course = new Course();
        course.setId(dto.id());
        course.setName(dto.name());
        course.setLevel(dto.level());
        course.setHeadTeacherId(dto.headTeacherId());
        course.setStudentCount(dto.studentCount());
        return course;
    }
}
