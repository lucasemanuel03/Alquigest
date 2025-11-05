package com.alquileres.controller;

import com.alquileres.dto.ActualizacionMontosServiciosRequest;
import com.alquileres.dto.PagoServicioResponseDTO;
import com.alquileres.dto.ActualizarPagoServicioRequest;
import com.alquileres.dto.RegistroPagoBatchRequest;
import com.alquileres.dto.RegistroPagoBatchResponse;
import com.alquileres.model.PagoServicio;
import com.alquileres.service.PagoServicioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pagos-servicios")
@Tag(name = "Pagos de Servicios", description = "API para gestión de pagos de servicios")
public class PagoServicioController {

    @Autowired
    private PagoServicioService pagoServicioService;

    /**
     * Actualiza los montos de los pagos de servicios no pagados de un contrato
     *
     * @param request JSON con contratoId y array de [tipoServicioId - nuevoMonto]
     * @return Resumen de actualizaciones realizadas
     */
    @PutMapping("/actualizar-montos")
    @Operation(summary = "Actualizar montos de pagos no pagados",
               description = "Actualiza los montos de todos los pagos de servicios no pagados de un contrato. " +
                           "Recibe un contratoId y un array de actualizaciones con tipoServicioId y nuevoMonto. " +
                           "Solo actualiza montos que no sean nulos o cero.")
    public ResponseEntity<?> actualizarMontosPagosNoPagados(
            @Valid @RequestBody ActualizacionMontosServiciosRequest request) {
        try {
            Map<String, Object> resultado = pagoServicioService.actualizarMontosPagosNoPagados(request);
            return ResponseEntity.ok(resultado);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                    "error", e.getMessage(),
                    "mensaje", "No se pudo completar la actualización"
                ));
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Error interno del servidor",
                    "mensaje", e.getMessage()
                ));
        }
    }

    /**
     * Obtiene todos los pagos no pagados de un contrato (solo información necesaria)
     *
     * @param contratoId ID del contrato
     * @return Lista de pagos no pagados (DTO)
     */
    @GetMapping("/contrato/{contratoId}/no-pagados")
    @Operation(summary = "Obtener pagos no pagados de un contrato",
               description = "Retorna todos los pagos de servicios que aún no han sido pagados para un contrato específico")
    public ResponseEntity<List<PagoServicioResponseDTO>> obtenerPagosNoPagadosPorContrato(
            @PathVariable Long contratoId) {
        try {
            List<PagoServicio> pagos = pagoServicioService.obtenerPagosNoPagadosPorContrato(contratoId);
            List<PagoServicioResponseDTO> dtos = pagos.stream()
                    .map(PagoServicioResponseDTO::new)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .build();
        }
    }


    /**
     * Obtiene todos los pagos de un contrato (solo información necesaria)
     *
     * @param contratoId ID del contrato
     * @return Lista de todos los pagos (DTO)
     */
    @GetMapping("/contrato/{contratoId}")
    @Operation(summary = "Obtener todos los pagos de un contrato",
               description = "Retorna todos los pagos de servicios (pagados y no pagados) para un contrato específico")
    public ResponseEntity<List<PagoServicioResponseDTO>> obtenerPagosPorContrato(
            @PathVariable Long contratoId) {
        try {
            List<PagoServicio> pagos = pagoServicioService.obtenerPagosPorContrato(contratoId);
            List<PagoServicioResponseDTO> dtos = pagos.stream()
                    .map(PagoServicioResponseDTO::new)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .build();
        }
    }

    /**
     * Cuenta la cantidad de pagos de servicio del mes actual
     * Retorna totales activos y pendientes (no pagados)
     *
     * @return JSON con serviciosTotales y serviciosPendientes del mes actual
     */
    @GetMapping("/count/pendientes")
    @Operation(summary = "Contar pagos del mes actual",
               description = "Retorna la cantidad de pagos de servicios activos del mes actual (totales y pendientes)")
    public ResponseEntity<Map<String, Long>> contarPagosPendientes() {
        try {
            Map<String, Long> resultado = pagoServicioService.contarPagosPendientes();
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            Map<String, Long> errorResponse = new HashMap<>();
            errorResponse.put("serviciosTotales", 0L);
            errorResponse.put("serviciosPendientes", 0L);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse);
        }
    }

    /**
     * Obtiene un pago de servicio por su ID
     *
     * @param pagoId ID del pago
     * @return Pago encontrado
     */
    @GetMapping("/{pagoId}")
    @Operation(summary = "Obtener un pago de servicio por ID",
               description = "Retorna un pago de servicio específico")
    public ResponseEntity<?> obtenerPagoPorId(@PathVariable Integer pagoId) {
        try {
            PagoServicio pago = pagoServicioService.obtenerPagoPorId(pagoId);
            return ResponseEntity.ok(pago);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Actualiza un pago de servicio específico
     *
     * @param pagoId ID del pago a actualizar
     * @param request Datos a actualizar
     * @return Pago actualizado
     */
    @PutMapping("/{pagoId}")
    @Operation(summary = "Actualizar un pago de servicio",
               description = "Actualiza los datos de un pago de servicio específico. " +
                           "Solo actualiza los campos que se envíen en la solicitud (los nulos se ignoran).")
    public ResponseEntity<?> actualizarPagoServicio(
            @PathVariable Integer pagoId,
            @Valid @RequestBody ActualizarPagoServicioRequest request) {
        try {
            PagoServicio pagoActualizado = pagoServicioService.actualizarPagoServicio(pagoId, request);
            return ResponseEntity.ok(pagoActualizado);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Error interno del servidor",
                    "mensaje", e.getMessage()
                ));
        }
    }

    /**
     * Registra múltiples pagos de servicio en batch (procesamiento por lotes)
     *
     * @param request Lista de pagos a registrar con sus datos
     * @return Resumen del procesamiento con detalle de cada pago
     */
    @PutMapping("/batch")
    @Operation(summary = "Registrar pagos de servicio en batch",
               description = "Registra múltiples pagos de servicio en una sola operación. " +
                           "Cada pago se procesa individualmente y el resultado se incluye en la respuesta. " +
                           "Si un pago falla, se registra el error pero se continúa con los demás pagos.")
    public ResponseEntity<?> registrarPagosBatch(
            @Valid @RequestBody RegistroPagoBatchRequest request) {
        try {
            RegistroPagoBatchResponse response = pagoServicioService.registrarPagosBatch(request);

            // Si todos fallaron, retornar error 400
            if (response.getExitosos() == 0 && response.getFallidos() > 0) {
                return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
            }

            // Si todos fueron exitosos, retornar 200
            // Si algunos fueron exitosos y otros fallaron, retornar 207 Multi-Status
            HttpStatus status = response.getFallidos() > 0 ? HttpStatus.MULTI_STATUS : HttpStatus.OK;
            return ResponseEntity
                .status(status)
                .body(response);

        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Error interno del servidor",
                    "mensaje", e.getMessage()
                ));
        }
    }
}
