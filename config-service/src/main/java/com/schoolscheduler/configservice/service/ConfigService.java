package com.schoolscheduler.configservice.service;

import com.schoolscheduler.configservice.dto.ConfigDto;
import java.util.List;

public interface ConfigService {
    List<ConfigDto> findAll();

    List<ConfigDto> saveAll(List<ConfigDto> entries);
}
