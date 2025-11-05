package com.alquileres.controller;

import com.alquileres.dto.CrearServicioRequest;
import com.alquileres.dto.FechaInicioRequest;
import com.alquileres.dto.ActualizarServicioXContratoRequest;
import com.alquileres.dto.ServicioXContratoResponseDTO;
import com.alquileres.model.ServicioXContrato;
import com.alquileres.service.ServicioXContratoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/servicios-contrato")
@Tag(name = "Servicios por Contrato", description = "API para gestión de servicios asociados a contratos")
public class ServicioXContratoController {

    @Autowired
    private ServicioXContratoService servicioXContratoService;

    /**
     * Crea uno o varios servicios para contratos
     * Automáticamente crea la configuración de pago y generará facturas mensuales
     *
     * @param requests Lista de servicios a crear
     * @return Los servicios creados y, en caso de errores parciales, un mapa con los errores por índice
     */
    @PostMapping
    @Operation(summary = "Crear servicio(s) para contrato(s)",
               description = "Crea uno o varios servicios asociados a contratos. " +
                           "Automáticamente crea la configuración de pago que generará facturas mensuales " +
                           "con vencimiento el día 10 de cada mes.")
    public ResponseEntity<?> crearServicio(@Valid @RequestBody List<CrearServicioRequest> requests) {
        List<ServicioXContratoResponseDTO> creados = new ArrayList<>();
        Map<Integer, String> errores = new HashMap<>();

        for (int i = 0; i < requests.size(); i++) {
            CrearServicioRequest request = requests.get(i);
            int reintentos = 3;
            boolean exitoso = false;

            while (reintentos > 0 && !exitoso) {
                try {
                    ServicioXContrato servicio = servicioXContratoService.crearServicio(
                            request.getContratoId(),
                            request.getTipoServicioId(),
                            request.getNroCuenta(),
                            request.getNroContrato(),
                            request.getNroContratoServicio(),
                            request.getEsDeInquilino(),
                            request.getEsAnual(),
                            request.getFechaInicio()
                    );
                    // Convertir a DTO para evitar problemas de serialización
                    creados.add(new ServicioXContratoResponseDTO(servicio));
                    exitoso = true;
                } catch (org.springframework.dao.CannotAcquireLockException |
                         org.springframework.dao.DataAccessResourceFailureException e) {
                    reintentos--;
                    if (reintentos > 0) {
                        try {
                            Thread.sleep(300); // Esperar más tiempo antes de reintentar
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                        }
                    } else {
                        errores.put(i, "Base de datos bloqueada. El servicio '" +
                                    (request.getTipoServicioId() != null ? request.getTipoServicioId() : "desconocido") +
                                    "' no pudo ser creado después de varios intentos.");
                    }
                } catch (RuntimeException e) {
                    errores.put(i, e.getMessage());
                    break; // No reintentar errores de validación
                } catch (Exception e) {
                    errores.put(i, "Error interno al crear el servicio: " + e.getMessage());
                    break;
                }
            }
        }

        if (errores.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("creados", creados));
        } else {
            return ResponseEntity.status(HttpStatus.MULTI_STATUS)
                    .body(Map.of("creados", creados, "errores", errores));
        }
    }

    /**
     * Obtiene todos los servicios de un contrato (solo datos del servicio)
     *
     * @param contratoId ID del contrato
     * @return Lista de servicios (DTO) con los campos solicitados
     */
    @GetMapping("/contrato/{contratoId}")
    @Operation(summary = "Obtener servicios de un contrato",
               description = "Retorna todos los servicios (activos e inactivos) asociados a un contrato, solo con los datos del servicio")
    public ResponseEntity<List<ServicioXContratoResponseDTO>> obtenerServiciosPorContrato(
            @PathVariable Long contratoId) {
        try {
            List<ServicioXContrato> servicios = servicioXContratoService.obtenerServiciosPorContrato(contratoId);
            List<ServicioXContratoResponseDTO> dtos = servicios.stream()
                    .map(ServicioXContratoResponseDTO::new)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene solo los servicios activos de un contrato
     *
     * @param contratoId ID del contrato
     * @return Lista de servicios activos
     */
    @GetMapping("/contrato/{contratoId}/activos")
    @Operation(summary = "Obtener servicios activos de un contrato",
               description = "Retorna únicamente los servicios activos de un contrato")
    public ResponseEntity<List<ServicioXContrato>> obtenerServiciosActivosPorContrato(
            @PathVariable Long contratoId) {
        try {
            List<ServicioXContrato> servicios = servicioXContratoService.obtenerServiciosActivosPorContrato(contratoId);
            return ResponseEntity.ok(servicios);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Desactiva un servicio
     *
     * @param servicioId ID del servicio
     * @return Respuesta de éxito
     */
    @PutMapping("/{servicioId}/desactivar")
    @Operation(summary = "Desactivar servicio",
               description = "Desactiva un servicio. Ya no se generarán facturas para este servicio.")
    public ResponseEntity<?> desactivarServicio(@PathVariable Integer servicioId) {
        try {
            servicioXContratoService.desactivarServicio(servicioId);
            return ResponseEntity.ok(Map.of("mensaje", "Servicio desactivado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al desactivar el servicio"));
        }
    }

    /**
     * Reactiva un servicio
     *
     * @param servicioId ID del servicio
     * @param request Datos de reactivación (fechaInicio)
     * @return Respuesta de éxito
     */
    @PutMapping("/{servicioId}/reactivar")
    @Operation(summary = "Reactivar servicio",
               description = "Reactiva un servicio previamente desactivado. " +
                           "Se reanudará la generación de facturas.")
    public ResponseEntity<?> reactivarServicio(
            @PathVariable Integer servicioId,
            @Valid @RequestBody FechaInicioRequest request) {
        try {
            servicioXContratoService.reactivarServicio(servicioId, request.getFechaInicio());
            return ResponseEntity.ok(Map.of("mensaje", "Servicio reactivado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al reactivar el servicio"));
        }
    }

    /**
     * Actualiza los datos de un servicio por contrato
     *
     * @param servicioId ID del servicio a actualizar
     * @param request Datos a actualizar (nroCuenta, nroContratoServicio, esDeInquilino, esAnual)
     * @return El servicio actualizado
     */
    @PutMapping("/{servicioId}")
    @Operation(summary = "Actualizar servicio por contrato",
               description = "Actualiza los datos de un servicio: nroCuenta, nroContratoServicio, esDeInquilino y esAnual")
    public ResponseEntity<?> actualizarServicio(
            @PathVariable Integer servicioId,
            @Valid @RequestBody ActualizarServicioXContratoRequest request) {
        try {
            ServicioXContrato servicioActualizado = servicioXContratoService.actualizarServicio(
                    servicioId,
                    request.getNroCuenta(),
                    request.getNroContratoServicio(),
                    request.getEsDeInquilino(),
                    request.getEsAnual()
            );

            // Convertir a DTO para la respuesta
            ServicioXContratoResponseDTO dto = new ServicioXContratoResponseDTO(servicioActualizado);

            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al actualizar el servicio: " + e.getMessage()));
        }
    }

    /**
     * Obtiene un servicio por ID
     *
     * @param servicioId ID del servicio
     * @return El servicio si existe
     */
    @GetMapping("/{servicioId}")
    @Operation(summary = "Obtener servicio por ID",
               description = "Retorna los detalles de un servicio específico")
    public ResponseEntity<?> obtenerServicioPorId(@PathVariable Integer servicioId) {
        try {
            return servicioXContratoService.obtenerServicioPorIdDTO(servicioId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
