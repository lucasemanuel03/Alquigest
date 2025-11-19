package com.alquileres.controller;

import com.alquileres.util.BCRAApiClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/icl")
@Tag(name = "ICL BCRA", description = "Endpoints para consultar el Índice de Contratos de Locación del BCRA")
public class ICLController {

    private final BCRAApiClient bcraApiClient;

    public ICLController(BCRAApiClient bcraApiClient) {
        this.bcraApiClient = bcraApiClient;
    }

    /**
     * GET /api/icl/tasa - Obtener la tasa de aumento del ICL entre dos fechas
     */
    @GetMapping("/tasa")
    @Operation(summary = "Obtener tasa de aumento del ICL",
               description = "Consulta la API del BCRA para obtener la tasa de aumento del ICL entre dos fechas")
    public ResponseEntity<Map<String, Object>> obtenerTasaICL(
            @RequestParam String fechaInicio,
            @RequestParam String fechaFin) {

        BigDecimal tasaAumento = bcraApiClient.obtenerTasaAumentoICL(fechaInicio, fechaFin);

        Map<String, Object> response = new HashMap<>();
        response.put("fechaInicio", fechaInicio);
        response.put("fechaFin", fechaFin);
        response.put("tasaAumento", tasaAumento);
        response.put("porcentajeAumento", tasaAumento.subtract(BigDecimal.ONE)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP));

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/icl/calcular - Calcular el nuevo monto aplicando ICL
     */
    @GetMapping("/calcular")
    @Operation(summary = "Calcular nuevo monto con ICL",
               description = "Calcula el nuevo monto de un alquiler aplicando la tasa de aumento del ICL")
    public ResponseEntity<Map<String, Object>> calcularMontoConICL(
            @RequestParam BigDecimal montoOriginal,
            @RequestParam String fechaInicio,
            @RequestParam String fechaFin) {

        BigDecimal nuevoMonto = bcraApiClient.calcularNuevoMontoConICL(montoOriginal, fechaInicio, fechaFin);
        BigDecimal tasaAumento = nuevoMonto.divide(montoOriginal, 6, BigDecimal.ROUND_HALF_UP);
        BigDecimal diferencia = nuevoMonto.subtract(montoOriginal);

        Map<String, Object> response = new HashMap<>();
        response.put("montoOriginal", montoOriginal);
        response.put("nuevoMonto", nuevoMonto);
        response.put("diferencia", diferencia);
        response.put("tasaAumento", tasaAumento);
        response.put("porcentajeAumento", tasaAumento.subtract(BigDecimal.ONE)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP));
        response.put("fechaInicio", fechaInicio);
        response.put("fechaFin", fechaFin);

        return ResponseEntity.ok(response);
    }
}

