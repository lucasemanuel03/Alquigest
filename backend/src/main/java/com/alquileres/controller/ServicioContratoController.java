package com.alquileres.controller;

import com.alquileres.dto.ActualizarServicioContratoRequest;
import com.alquileres.dto.CrearServicioRequest;
import com.alquileres.dto.ServicioContratoDTO;
import com.alquileres.model.ServicioContrato;
import com.alquileres.service.ServicioContratoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
    public ResponseEntity<List<ServicioContratoDTO>> getServiciosByContrato(@PathVariable Long contratoId) {
        List<ServicioContratoDTO> servicios = servicioContratoService.getServiciosByContrato(contratoId)
                .stream()
                .map(ServicioContratoDTO::new)
                .toList();
        return ResponseEntity.ok(servicios);
    }

    @GetMapping("/contrato/{contratoId}/activos")
    @Operation(summary = "Obtener servicios activos por contrato", description = "Obtiene todos los servicios activos de un contrato")
    public ResponseEntity<List<ServicioContratoDTO>> getServiciosActivosByContrato(@PathVariable Long contratoId) {
        List<ServicioContratoDTO> servicios = servicioContratoService.getServiciosActivosByContrato(contratoId)
                .stream()
                .map(ServicioContratoDTO::new)
                .toList();
        return ResponseEntity.ok(servicios);
    }

    @PostMapping
    @Operation(summary = "Crear servicios en lote", description = "Crea uno o varios servicios para un contrato")
    public ResponseEntity<List<ServicioContratoDTO>> crearServicios(@Valid @RequestBody List<CrearServicioRequest> requests) {
        List<ServicioContratoDTO> serviciosCreados = requests.stream()
                .map(request -> servicioContratoService.crearServicioCompleto(
                        request.getContratoId(),
                        request.getTipoServicioId(),
                        request.getNroCuenta(),
                        request.getNroContrato(),
                        request.getNroContratoServicio(),
                        request.getEsDeInquilino(),
                        request.getEsAnual(),
                        request.getFechaInicio()
                ))
                .map(ServicioContratoDTO::new)
                .toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(serviciosCreados);
    }

    @PostMapping("/single")
    @Operation(summary = "Crear un servicio", description = "Crea un nuevo servicio para un contrato")
    public ResponseEntity<ServicioContratoDTO> crearServicioIndividual(@Valid @RequestBody CrearServicioRequest request) {
        ServicioContrato servicio = servicioContratoService.crearServicioCompleto(
                request.getContratoId(),
                request.getTipoServicioId(),
                request.getNroCuenta(),
                request.getNroContrato(),
                request.getNroContratoServicio(),
                request.getEsDeInquilino(),
                request.getEsAnual(),
                request.getFechaInicio()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(new ServicioContratoDTO(servicio));
    }

    @PutMapping("/{servicioId}")
    @Operation(summary = "Actualizar servicio", description = "Actualiza los datos de un servicio")
    public ResponseEntity<ServicioContratoDTO> actualizarServicio(
            @PathVariable Integer servicioId,
            @Valid @RequestBody ActualizarServicioContratoRequest request) {
        ServicioContrato servicio = servicioContratoService.actualizarServicio(
                servicioId,
                request.getNroCuenta(),
                null, // nroContrato ya no se usa
                request.getNroContratoServicio(),
                request.getEsDeInquilino(),
                request.getEsAnual()
        );
        return ResponseEntity.ok(new ServicioContratoDTO(servicio));
    }

    @PatchMapping("/{servicioId}/desactivar")
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

