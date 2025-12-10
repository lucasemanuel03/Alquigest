package com.alquileres.config;

import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@Configuration
public class TimeZoneConfig {

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("America/Argentina/Buenos_Aires"));
        System.setProperty("user.timezone", "America/Argentina/Buenos_Aires");
    }
}

