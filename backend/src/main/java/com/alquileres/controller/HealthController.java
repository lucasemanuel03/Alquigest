package com.alquileres.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthRoot() {
        log.info("Health check received at /health");
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Alquigest API está funcionando correctamente");
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> healthApi() {
        log.info("Health check received at /api/health");
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Alquigest API está funcionando correctamente");
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
}
