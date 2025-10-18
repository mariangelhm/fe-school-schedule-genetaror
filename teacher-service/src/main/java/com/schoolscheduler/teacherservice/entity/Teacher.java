package com.schoolscheduler.teacherservice.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "teacher")
public class Teacher {

    public enum ContractType {
        FULL,
        PARTIAL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", nullable = false)
    private ContractType contractType;

    @Column(name = "weekly_hours", nullable = false)
    private Integer weeklyHours;

    @ElementCollection
    @CollectionTable(name = "teacher_subjects", joinColumns = @JoinColumn(name = "teacher_id"))
    @Column(name = "subject_id")
    private Set<Long> subjectIds = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "teacher_available_blocks", joinColumns = @JoinColumn(name = "teacher_id"))
    @Column(name = "block")
    private Set<String> availableBlocks = new HashSet<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ContractType getContractType() {
        return contractType;
    }

    public void setContractType(ContractType contractType) {
        this.contractType = contractType;
    }

    public Integer getWeeklyHours() {
        return weeklyHours;
    }

    public void setWeeklyHours(Integer weeklyHours) {
        this.weeklyHours = weeklyHours;
    }

    public Set<Long> getSubjectIds() {
        return subjectIds;
    }

    public void setSubjectIds(Set<Long> subjectIds) {
        this.subjectIds = subjectIds;
    }

    public Set<String> getAvailableBlocks() {
        return availableBlocks;
    }

    public void setAvailableBlocks(Set<String> availableBlocks) {
        this.availableBlocks = availableBlocks;
    }
}
