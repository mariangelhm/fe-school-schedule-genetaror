package com.schoolscheduler.holidayservice.service;

import com.schoolscheduler.holidayservice.dto.HolidayDto;
import com.schoolscheduler.holidayservice.entity.Holiday;
import com.schoolscheduler.holidayservice.repository.HolidayRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class HolidayServiceImpl implements HolidayService {

    private final HolidayRepository holidayRepository;

    public HolidayServiceImpl(HolidayRepository holidayRepository) {
        this.holidayRepository = holidayRepository;
    }

    @Override
    public List<HolidayDto> findAll() {
        return holidayRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public HolidayDto findById(Long id) {
        return holidayRepository.findById(id).map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Holiday not found"));
    }

    @Override
    public HolidayDto create(HolidayDto dto) {
        Holiday holiday = toEntity(dto);
        holiday.setId(null);
        return toDto(holidayRepository.save(holiday));
    }

    @Override
    public HolidayDto update(Long id, HolidayDto dto) {
        Holiday holiday = holidayRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Holiday not found"));
        holiday.setDate(dto.date());
        holiday.setDescription(dto.description());
        return toDto(holidayRepository.save(holiday));
    }

    @Override
    public void delete(Long id) {
        holidayRepository.deleteById(id);
    }

    @Override
    public boolean isHoliday(LocalDate date) {
        return holidayRepository.findByDate(date).isPresent();
    }

    private HolidayDto toDto(Holiday holiday) {
        return new HolidayDto(holiday.getId(), holiday.getDate(), holiday.getDescription());
    }

    private Holiday toEntity(HolidayDto dto) {
        Holiday holiday = new Holiday();
        holiday.setId(dto.id());
        holiday.setDate(dto.date());
        holiday.setDescription(dto.description());
        return holiday;
    }
}
