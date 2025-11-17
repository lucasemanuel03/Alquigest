package com.alquileres.controller;

import com.alquileres.dto.PropietarioDTO;
import com.alquileres.dto.RevelarClaveFiscalRequest;
import com.alquileres.service.PropietarioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/propietarios")
@Tag(name = "Propietarios", description = "API para gestión de propietarios")
public class PropietarioController {

    private final PropietarioService propietarioService;

    public PropietarioController(PropietarioService propietarioService) {
        this.propietarioService = propietarioService;
    }

    // GET /api/propietarios - Obtener todos los propietarios
    @GetMapping
    public ResponseEntity<List<PropietarioDTO>> obtenerTodosLosPropietarios() {
        List<PropietarioDTO> propietarios = propietarioService.obtenerTodosLosPropietarios();
        return ResponseEntity.ok(propietarios);
    }

    // GET /api/propietarios/activos - Obtener solo propietarios activos
    @GetMapping("/activos")
    public ResponseEntity<List<PropietarioDTO>> obtenerPropietariosActivos() {
        List<PropietarioDTO> propietarios = propietarioService.obtenerPropietariosActivos();
        return ResponseEntity.ok(propietarios);
    }

    // GET /api/propietarios/inactivos - Obtener solo propietarios inactivos
    @GetMapping("/inactivos")
    public ResponseEntity<List<PropietarioDTO>> obtenerPropietariosInactivos() {
        List<PropietarioDTO> propietarios = propietarioService.obtenerPropietariosInactivos();
        return ResponseEntity.ok(propietarios);
    }

    // GET /api/propietarios/count/activos - Contar propietarios activos
    @GetMapping("/count/activos")
    public ResponseEntity<Long> contarPropietariosActivos() {
        Long count = propietarioService.contarPropietariosActivos();
        return ResponseEntity.ok(count);
    }

    // GET /api/propietarios/{id} - Obtener propietario por ID
    @GetMapping("/{id}")
    public ResponseEntity<PropietarioDTO> obtenerPropietarioPorId(@PathVariable Long id) {
        PropietarioDTO propietario = propietarioService.obtenerPropietarioPorId(id);
        return ResponseEntity.ok(propietario);
    }

    // GET /api/propietarios/cuil/{cuil} - Buscar propietario por CUIL
    @GetMapping("/cuil/{cuil}")
    public ResponseEntity<PropietarioDTO> buscarPorCuil(@PathVariable String cuil) {
        PropietarioDTO propietario = propietarioService.buscarPorCuil(cuil);
        return ResponseEntity.ok(propietario);
    }

    // GET /api/propietarios/buscar - Buscar por nombre y/o apellido
    @GetMapping("/buscar")
    public ResponseEntity<List<PropietarioDTO>> buscarPorNombreYApellido(
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String apellido) {
        List<PropietarioDTO> propietarios = propietarioService.buscarPorNombreYApellido(nombre, apellido);
        return ResponseEntity.ok(propietarios);
    }

    // POST /api/propietarios - Crear nuevo propietario
    @PostMapping
    public ResponseEntity<PropietarioDTO> crearPropietario(@Valid @RequestBody PropietarioDTO propietarioDTO) {
        PropietarioDTO nuevoPropietario = propietarioService.crearPropietario(propietarioDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoPropietario);
    }

    // PUT /api/propietarios/{id} - Actualizar propietario
    @PutMapping("/{id}")
    public ResponseEntity<PropietarioDTO> actualizarPropietario(
            @PathVariable Long id,
            @Valid @RequestBody PropietarioDTO propietarioDTO) {
        PropietarioDTO propietarioActualizado = propietarioService.actualizarPropietario(id, propietarioDTO);
        return ResponseEntity.ok(propietarioActualizado);
    }

    // PATCH /api/propietarios/{id} - Actualizar parcialmente propietario (sin afectar clave fiscal si no se envía)
    @PatchMapping("/{id}")
    @Operation(summary = "Actualización parcial de propietario", description = "Actualiza solo los campos enviados. La clave fiscal solo se modifica si se incluye explícitamente en el request")
    public ResponseEntity<PropietarioDTO> actualizarParcialPropietario(
            @PathVariable Long id,
            @RequestBody PropietarioDTO propietarioDTO) {
        PropietarioDTO propietarioActualizado = propietarioService.actualizarParcialPropietario(id, propietarioDTO);
        return ResponseEntity.ok(propietarioActualizado);
    }

    // PATCH /api/propietarios/{id}/desactivar - Desactivar propietario (eliminación lógica)
    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<Void> desactivarPropietario(@PathVariable Long id) {
        propietarioService.desactivarPropietario(id);
        return ResponseEntity.noContent().build();
    }

    // PATCH /api/propietarios/{id}/activar - Activar propietario inactivo
    @PatchMapping("/{id}/activar")
    public ResponseEntity<Void> activarPropietario(@PathVariable Long id) {
        propietarioService.activarPropietario(id);
        return ResponseEntity.noContent().build();
    }

    // POST /api/propietarios/{id}/clave-fiscal/revelar - Revelar clave fiscal con autenticación extra
    @PostMapping("/{id}/clave-fiscal/revelar")
    @Operation(summary = "Revelar clave fiscal", description = "Requiere confirmar contraseña del usuario para mayor seguridad")
    public ResponseEntity<Map<String, String>> revelarClaveFiscal(
            @PathVariable Long id,
            @Valid @RequestBody RevelarClaveFiscalRequest request,
            HttpServletRequest httpRequest) {

        // Obtener usuario autenticado
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        // Obtener IP del cliente
        String ipAddress = httpRequest.getRemoteAddr();

        // Revelar clave fiscal (valida contraseña internamente)
        String claveFiscal = propietarioService.revelarClaveFiscal(
            id,
            username,
            request.getPassword(),
            ipAddress
        );

        return ResponseEntity.ok(Map.of(
            "claveFiscal", claveFiscal,
            "advertencia", "Esta clave es confidencial. No la compartas."
        ));
    }

    // PUT /api/propietarios/{id}/clave-fiscal - Modificar solo la clave fiscal
    @PutMapping("/{id}/clave-fiscal")
    @Operation(summary = "Modificar clave fiscal", description = "Modifica solamente la clave fiscal de un propietario")
    public ResponseEntity<PropietarioDTO> modificarClaveFiscal(
            @PathVariable Long id,
            @Valid @RequestBody com.alquileres.dto.ModificarClaveFiscalRequest request) {
        PropietarioDTO propietarioActualizado = propietarioService.modificarClaveFiscal(id, request.getClaveFiscal());
        return ResponseEntity.ok(propietarioActualizado);
    }
}
