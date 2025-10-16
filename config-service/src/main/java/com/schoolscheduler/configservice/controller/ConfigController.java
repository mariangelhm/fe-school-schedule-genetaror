package com.schoolscheduler.configservice.controller;

import com.schoolscheduler.configservice.dto.ConfigDto;
import com.schoolscheduler.configservice.service.ConfigService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    private final ConfigService configService;

    public ConfigController(ConfigService configService) {
        this.configService = configService;
    }

    @GetMapping
    public ResponseEntity<List<ConfigDto>> findAll() {
        return ResponseEntity.ok(configService.findAll());
    }

    @PutMapping
    public ResponseEntity<List<ConfigDto>> update(@Valid @RequestBody List<ConfigDto> entries) {
        return ResponseEntity.ok(configService.saveAll(entries));
    }
}
