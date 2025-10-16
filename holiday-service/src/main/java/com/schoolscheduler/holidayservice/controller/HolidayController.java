package com.schoolscheduler.holidayservice.controller;

import com.schoolscheduler.holidayservice.dto.HolidayDto;
import com.schoolscheduler.holidayservice.service.HolidayService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/holidays")
public class HolidayController {

    private final HolidayService holidayService;

    public HolidayController(HolidayService holidayService) {
        this.holidayService = holidayService;
    }

    @GetMapping
    public ResponseEntity<List<HolidayDto>> findAll() {
        return ResponseEntity.ok(holidayService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HolidayDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(holidayService.findById(id));
    }

    @PostMapping
    public ResponseEntity<HolidayDto> create(@Valid @RequestBody HolidayDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(holidayService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HolidayDto> update(@PathVariable Long id, @Valid @RequestBody HolidayDto dto) {
        return ResponseEntity.ok(holidayService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        holidayService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/is-holiday")
    public ResponseEntity<Boolean> isHoliday(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(holidayService.isHoliday(date));
    }
}
