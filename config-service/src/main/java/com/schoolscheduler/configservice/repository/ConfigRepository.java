package com.schoolscheduler.configservice.repository;

import com.schoolscheduler.configservice.entity.ConfigProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConfigRepository extends JpaRepository<ConfigProperty, Long> {
}
