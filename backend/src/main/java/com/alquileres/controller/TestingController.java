package com.alquileres.controller;

import com.alquileres.service.ClockService;
import com.alquileres.util.BCRAApiClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * Controlador para utilidades de testing.
 * Permite configurar la fecha del sistema para facilitar pruebas de procesos automáticos.
 */
@RestController
@RequestMapping("/api/testing")
@Tag(name = "Testing", description = "Endpoints para facilitar testing y debugging")
public class TestingController {

    private final ClockService clockService;

    public TestingController(ClockService clockService) {
        this.clockService = clockService;
    }

    /**
     * Configura una fecha específica para testing.
     * Todos los procesos del sistema usarán esta fecha en lugar de la fecha real.
     *
     * Ejemplo: POST /api/testing/set-date?date=2025-11-08
     *
     * @param date Fecha a configurar en formato ISO (YYYY-MM-DD)
     * @return Confirmación con la fecha configurada
     */
    @PostMapping("/set-date")
    @Operation(summary = "Configura una fecha específica para testing (aaaa-mm-dd)")
    public ResponseEntity<Map<String, String>> setTestDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        clockService.setOverrideDate(date);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Fecha configurada exitosamente para testing");
        response.put("currentDate", clockService.getCurrentDate().toString());
        response.put("isOverridden", "true");

        return ResponseEntity.ok(response);
    }

    /**
     * Restaura el sistema a usar la fecha real del servidor.
     *
     * @return Confirmación con la fecha actual real
     */
    @PostMapping("/reset-date")
    @Operation(summary = "Restaura el sistema a usar la fecha real")
    public ResponseEntity<Map<String, String>> resetDate() {
        clockService.clearOverride();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Fecha restaurada al sistema real");
        response.put("currentDate", clockService.getCurrentDate().toString());
        response.put("isOverridden", "false");

        return ResponseEntity.ok(response);
    }

    /**
     * Consulta la fecha actual del sistema.
     *
     * @return Información sobre la fecha actual y si está configurada manualmente
     */
    @GetMapping("/current-date")
    @Operation(summary = "Consulta la fecha actual del sistema")
    public ResponseEntity<Map<String, Object>> getCurrentDate() {
        Map<String, Object> response = new HashMap<>();
        response.put("currentDate", clockService.getCurrentDate().toString());
        response.put("currentDateTime", clockService.getCurrentDateTime().toString());
        response.put("isOverridden", clockService.isDateOverridden());
        response.put("year", clockService.getCurrentYear());
        response.put("month", clockService.getCurrentMonth());
        response.put("dayOfMonth", clockService.getCurrentDayOfMonth());

        clockService.getOverrideDate().ifPresent(date ->
            response.put("overrideDate", date.toString())
        );

        return ResponseEntity.ok(response);
    }
}

