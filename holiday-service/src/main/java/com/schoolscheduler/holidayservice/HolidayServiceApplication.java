package com.schoolscheduler.holidayservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class HolidayServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(HolidayServiceApplication.class, args);
    }
}
