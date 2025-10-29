package com.alquileres.controller;

import com.alquileres.dto.AlquilerDTO;
import com.alquileres.dto.AlquilerCreateDTO;
import com.alquileres.dto.RegistroPagoDTO;
import com.alquileres.dto.NotificacionPagoAlquilerDTO;
import com.alquileres.dto.AlquilerDetalladoDTO;
import com.alquileres.service.AlquilerService;
import com.alquileres.exception.BusinessException;
import com.alquileres.exception.ErrorCodes;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/alquileres")
@Tag(name = "Alquileres", description = "API para la gestion de pago de alquileres")
@CrossOrigin(origins = "*")
public class AlquilerController {

    @Autowired
    private AlquilerService alquilerService;

    // Obtener todos los alquileres
    @GetMapping
    public ResponseEntity<List<AlquilerDTO>> obtenerTodosLosAlquileres() {
        List<AlquilerDTO> alquileres = alquilerService.obtenerTodosLosAlquileres();
        return ResponseEntity.ok(alquileres);
    }

    // Obtener alquiler por ID
    @GetMapping("/{id}")
    public ResponseEntity<AlquilerDTO> obtenerAlquilerPorId(@PathVariable Long id) {
        AlquilerDTO alquiler = alquilerService.obtenerAlquilerPorId(id);
        return ResponseEntity.ok(alquiler);
    }

    // Obtener alquileres por contrato
    @GetMapping("/contrato/{contratoId}")
    public ResponseEntity<List<AlquilerDTO>> obtenerAlquileresPorContrato(@PathVariable Long contratoId) {
        List<AlquilerDTO> alquileres = alquilerService.obtenerAlquileresPorContrato(contratoId);
        return ResponseEntity.ok(alquileres);
    }

    // Obtener alquileres pendientes
    @GetMapping("/pendientes")
    public ResponseEntity<List<AlquilerDTO>> obtenerAlquileresPendientes() {
        List<AlquilerDTO> alquileres = alquilerService.obtenerAlquileresPendientes();
        return ResponseEntity.ok(alquileres);
    }

    // Obtener alquileres pagados
    @GetMapping("/pagados")
    public ResponseEntity<List<AlquilerDTO>> obtenerAlquileresPagados() {
        List<AlquilerDTO> alquileres = alquilerService.obtenerAlquileresPagados();
        return ResponseEntity.ok(alquileres);
    }

    // Obtener alquileres pendientes por contrato
    @GetMapping("/contrato/{contratoId}/pendientes")
    public ResponseEntity<List<AlquilerDTO>> obtenerAlquileresPendientesPorContrato(@PathVariable Long contratoId) {
        List<AlquilerDTO> alquileres = alquilerService.obtenerAlquileresPendientesPorContrato(contratoId);
        return ResponseEntity.ok(alquileres);
    }

    // Obtener alquileres próximos a vencer
    @GetMapping("/proximos-vencer")
    public ResponseEntity<List<AlquilerDTO>> obtenerAlquileresProximosAVencer(
            @RequestParam(defaultValue = "7") int diasAntes) {
        List<AlquilerDTO> alquileres = alquilerService.obtenerAlquileresProximosAVencer(diasAntes);
        return ResponseEntity.ok(alquileres);
    }

    // Contar alquileres pendientes
    @GetMapping("/count/pendientes")
    public ResponseEntity<Long> contarAlquileresPendientes() {
        Long count = alquilerService.contarAlquileresPendientes();
        return ResponseEntity.ok(count);
    }

    // Contar alquileres próximos a vencer
    @GetMapping("/count/proximos-vencer")
    public ResponseEntity<Long> contarAlquileresProximosAVencer(
            @RequestParam(defaultValue = "7") int diasAntes) {
        Long count = alquilerService.contarAlquileresProximosAVencer(diasAntes);
        return ResponseEntity.ok(count);
    }

    // Crear nuevo alquiler
    @PostMapping
    public ResponseEntity<AlquilerDTO> crearAlquiler(@Valid @RequestBody AlquilerCreateDTO alquilerDTO) {
        AlquilerDTO nuevoAlquiler = alquilerService.crearAlquiler(alquilerDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoAlquiler);
    }

    // Actualizar alquiler
    @PutMapping("/{id}")
    public ResponseEntity<AlquilerDTO> actualizarAlquiler(
            @PathVariable Long id,
            @Valid @RequestBody AlquilerCreateDTO alquilerDTO) {
        AlquilerDTO alquilerActualizado = alquilerService.actualizarAlquiler(id, alquilerDTO);
        return ResponseEntity.ok(alquilerActualizado);
    }

    // Marcar alquiler como pagado
    @PatchMapping("/{id}/pagar")
    public ResponseEntity<AlquilerDTO> marcarComoPagado(
            @PathVariable Long id,
            @RequestBody RegistroPagoDTO registroPagoDTO) {
        AlquilerDTO alquilerPagado = alquilerService.marcarComoPagado(id, registroPagoDTO);
        return ResponseEntity.ok(alquilerPagado);
    }

    // Verificar si existe un alquiler
    @GetMapping("/{id}/existe")
    public ResponseEntity<Boolean> existeAlquiler(@PathVariable Long id) {
        boolean existe = alquilerService.existeAlquiler(id);
        return ResponseEntity.ok(existe);
    }

    // Calcular honorarios (10% de la suma de alquileres vigentes del mes)
    @GetMapping("/honorarios")
    public ResponseEntity<BigDecimal> calcularHonorarios() {
        BigDecimal honorarios = alquilerService.calcularHonorarios();
        return ResponseEntity.ok(honorarios);
    }

    // Calcular honorario de un alquiler específico (10% solo si está pagado)
    @GetMapping("/{id}/honorario")
    public ResponseEntity<BigDecimal> calcularHonorarioAlquiler(@PathVariable Long id) {
        BigDecimal honorario = alquilerService.calcularHonorarioAlquilerEspecifico(id);
        return ResponseEntity.ok(honorario);
    }

    // Obtener información detallada del alquiler (propietario, inmueble, monto, estado de pago, honorarios)
    @GetMapping("/{id}/detallado")
    public ResponseEntity<AlquilerDetalladoDTO> obtenerAlquilerDetallado(@PathVariable Long id) {
        AlquilerDetalladoDTO alquilerDetallado = alquilerService.obtenerAlquilerDetallado(id);
        return ResponseEntity.ok(alquilerDetallado);
    }

    // Obtener notificaciones de pago de alquileres no pagados del mes
    @GetMapping("/notificaciones/mes")
    public ResponseEntity<List<NotificacionPagoAlquilerDTO>> obtenerNotificacionesPagoAlquileresMes() {
        List<NotificacionPagoAlquilerDTO> notificaciones = alquilerService.obtenerNotificacionesPagoAlquileresMes();
        return ResponseEntity.ok(notificaciones);
    }
}
