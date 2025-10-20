package com.schoolscheduler.configservice.service;

import com.schoolscheduler.configservice.dto.ConfigDto;
import com.schoolscheduler.configservice.entity.ConfigProperty;
import com.schoolscheduler.configservice.repository.ConfigRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ConfigServiceImpl implements ConfigService {

    private final ConfigRepository configRepository;

    public ConfigServiceImpl(ConfigRepository configRepository) {
        this.configRepository = configRepository;
    }

    @Override
    public List<ConfigDto> findAll() {
        return configRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public List<ConfigDto> saveAll(List<ConfigDto> entries) {
        List<ConfigProperty> properties = entries.stream().map(this::toEntity).toList();
        return configRepository.saveAll(properties).stream().map(this::toDto).toList();
    }

    private ConfigDto toDto(ConfigProperty property) {
        return new ConfigDto(property.getId(), property.getKey(), property.getValue());
    }

    private ConfigProperty toEntity(ConfigDto dto) {
        ConfigProperty property = new ConfigProperty();
        property.setId(dto.id());
        property.setKey(dto.key());
        property.setValue(dto.value());
        return property;
    }
}
