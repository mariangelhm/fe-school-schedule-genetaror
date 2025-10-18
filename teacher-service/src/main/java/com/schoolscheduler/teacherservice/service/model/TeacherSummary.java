package com.schoolscheduler.teacherservice.service.model;

public record TeacherSummary(Long teacherId, int assignedBlocks, int availableBlocks) {
}
