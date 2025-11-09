package com.alquileres.controller;

import com.alquileres.model.ServicioContrato;
import com.alquileres.service.ServicioContratoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servicios-contrato")
@Tag(name = "Servicios Contrato", description = "Gestión de servicios asociados a contratos")
public class ServicioContratoController {

    private final ServicioContratoService servicioContratoService;

    public ServicioContratoController(ServicioContratoService servicioContratoService) {
        this.servicioContratoService = servicioContratoService;
    }

    @GetMapping("/contrato/{contratoId}")
    @Operation(summary = "Obtener servicios por contrato", description = "Obtiene todos los servicios de un contrato")
    public ResponseEntity<List<ServicioContrato>> getServiciosByContrato(@PathVariable Long contratoId) {
        List<ServicioContrato> servicios = servicioContratoService.getServiciosByContrato(contratoId);
        return ResponseEntity.ok(servicios);
    }

    @GetMapping("/contrato/{contratoId}/activos")
    @Operation(summary = "Obtener servicios activos por contrato", description = "Obtiene todos los servicios activos de un contrato")
    public ResponseEntity<List<ServicioContrato>> getServiciosActivosByContrato(@PathVariable Long contratoId) {
        List<ServicioContrato> servicios = servicioContratoService.getServiciosActivosByContrato(contratoId);
        return ResponseEntity.ok(servicios);
    }

    @PostMapping
    @Operation(summary = "Crear servicio", description = "Crea un nuevo servicio para un contrato")
    public ResponseEntity<ServicioContrato> crearServicio(
            @RequestParam Long contratoId,
            @RequestParam Integer tipoServicioId,
            @RequestParam(required = false) Boolean esDeInquilino,
            @RequestParam(required = false) Boolean esAnual) {
        ServicioContrato servicio = servicioContratoService.crearServicio(contratoId, tipoServicioId, esDeInquilino, esAnual);
        return ResponseEntity.status(HttpStatus.CREATED).body(servicio);
    }

    @PutMapping("/{servicioId}")
    @Operation(summary = "Actualizar servicio", description = "Actualiza los datos de un servicio")
    public ResponseEntity<ServicioContrato> actualizarServicio(
            @PathVariable Integer servicioId,
            @RequestParam(required = false) String nroCuenta,
            @RequestParam(required = false) String nroContrato,
            @RequestParam(required = false) String nroContratoServicio,
            @RequestParam(required = false) Boolean esDeInquilino,
            @RequestParam(required = false) Boolean esAnual) {
        ServicioContrato servicio = servicioContratoService.actualizarServicio(
                servicioId, nroCuenta, nroContrato, nroContratoServicio, esDeInquilino, esAnual);
        return ResponseEntity.ok(servicio);
    }

    @DeleteMapping("/{servicioId}")
    @Operation(summary = "Desactivar servicio", description = "Desactiva un servicio (borrado lógico)")
    public ResponseEntity<Void> desactivarServicio(@PathVariable Integer servicioId) {
        servicioContratoService.desactivarServicio(servicioId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{servicioId}/reactivar")
    @Operation(summary = "Reactivar servicio", description = "Reactiva un servicio previamente desactivado")
    public ResponseEntity<Void> reactivarServicio(@PathVariable Integer servicioId) {
        servicioContratoService.reactivarServicio(servicioId);
        return ResponseEntity.ok().build();
    }
}

