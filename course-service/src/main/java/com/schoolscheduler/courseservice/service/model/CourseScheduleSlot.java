package com.schoolscheduler.courseservice.service.model;

import java.time.LocalDate;

public record CourseScheduleSlot(LocalDate date, int block, String subjectName, String teacherName) {
}
