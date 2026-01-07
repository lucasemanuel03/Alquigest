package com.alquileres.service;

import com.alquileres.dto.InmuebleDTO;
import com.alquileres.model.Inmueble;
import com.alquileres.model.EstadoInmueble;
import com.alquileres.model.TipoInmueble;
import com.alquileres.repository.InmuebleRepository;
import com.alquileres.repository.PropietarioRepository;
import com.alquileres.repository.EstadoInmuebleRepository;
import com.alquileres.repository.TipoInmuebleRepository;
import com.alquileres.repository.ContratoRepository;
import com.alquileres.exception.BusinessException;
import com.alquileres.exception.ErrorCodes;
import com.alquileres.config.CacheNames;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InmuebleService {

    private final InmuebleRepository inmuebleRepository;
    private final PropietarioRepository propietarioRepository;
    private final EstadoInmuebleRepository estadoInmuebleRepository;
    private final TipoInmuebleRepository tipoInmuebleRepository;
    private final ContratoRepository contratoRepository;

    public InmuebleService(
            InmuebleRepository inmuebleRepository,
            PropietarioRepository propietarioRepository,
            EstadoInmuebleRepository estadoInmuebleRepository,
            TipoInmuebleRepository tipoInmuebleRepository,
            ContratoRepository contratoRepository) {
        this.inmuebleRepository = inmuebleRepository;
        this.propietarioRepository = propietarioRepository;
        this.estadoInmuebleRepository = estadoInmuebleRepository;
        this.tipoInmuebleRepository = tipoInmuebleRepository;
        this.contratoRepository = contratoRepository;
    }

    // Obtener todos los inmuebles
    public List<InmuebleDTO> obtenerTodosLosInmuebles() {
        List<Inmueble> inmuebles = inmuebleRepository.findAll();
        return inmuebles.stream()
                .map(InmuebleDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener solo inmuebles activos
    public List<InmuebleDTO> obtenerInmueblesActivos() {
        List<Inmueble> inmuebles = inmuebleRepository.findByEsActivoTrue();
        return inmuebles.stream()
                .map(InmuebleDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener solo inmuebles inactivos (con estado "Inactivo")
    public List<InmuebleDTO> obtenerInmueblesInactivos() {
        List<Inmueble> inmuebles = inmuebleRepository.findInmueblesConEstadoInactivo();
        return inmuebles.stream()
                .map(InmuebleDTO::new)
                .collect(Collectors.toList());
    }

    // Contar inmuebles activos
    public Long contarInmueblesActivos() {
        return inmuebleRepository.countByEsActivoTrue();
    }

    // Obtener inmuebles disponibles (estado "Disponible" solamente, excluye "En reparación")
    public List<InmuebleDTO> obtenerInmueblesDisponibles() {
        List<Inmueble> inmuebles = inmuebleRepository.findInmueblesRealmenteDisponibles();
        return inmuebles.stream()
                .map(InmuebleDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener inmuebles alquilados
    public List<InmuebleDTO> obtenerInmueblesAlquilados() {
        List<Inmueble> inmuebles = inmuebleRepository.findByEsAlquiladoTrueAndEsActivoTrue();
        return inmuebles.stream()
                .map(InmuebleDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener inmuebles no alquilados
    public List<InmuebleDTO> obtenerInmueblesNoAlquilados() {
        List<Inmueble> inmuebles = inmuebleRepository.findByEsAlquiladoFalseAndEsActivoTrue();
        return inmuebles.stream()
                .map(InmuebleDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener inmueble por ID
    public InmuebleDTO obtenerInmueblePorId(Long id) {
        Optional<Inmueble> inmueble = inmuebleRepository.findById(id);
        if (inmueble.isPresent()) {
            String tipoInmuebleNombre = "N/A";
            Optional<TipoInmueble> tipoInmueble = tipoInmuebleRepository.findById(inmueble.get().getTipoInmuebleId());
            if (tipoInmueble.isPresent()) {
                tipoInmuebleNombre = tipoInmueble.get().getNombre();
            }
            return new InmuebleDTO(inmueble.get(), tipoInmuebleNombre);
        } else {
            throw new BusinessException(
                ErrorCodes.INMUEBLE_NO_ENCONTRADO,
                "No se encontró el inmueble con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }
    }

    // Buscar inmuebles por propietario
    public List<InmuebleDTO> buscarPorPropietario(Long propietarioId) {
        List<Inmueble> inmuebles = inmuebleRepository.findByPropietarioId(propietarioId);
        return inmuebles.stream()
                .map(InmuebleDTO::new)
                .collect(Collectors.toList());
    }

    // Buscar inmuebles por dirección
    public List<InmuebleDTO> buscarPorDireccion(String direccion) {
        List<Inmueble> inmuebles = inmuebleRepository.findByDireccionContainingIgnoreCase(direccion);
        return inmuebles.stream()
                .map(InmuebleDTO::new)
                .collect(Collectors.toList());
    }

    // Crear nuevo inmueble
    public InmuebleDTO crearInmueble(InmuebleDTO inmuebleDTO) {
        // Validar que el propietario exista
        if (inmuebleDTO.getPropietarioId() != null) {
            if (!propietarioRepository.existsById(inmuebleDTO.getPropietarioId())) {
                throw new BusinessException(
                    ErrorCodes.PROPIETARIO_NO_ENCONTRADO,
                    "No existe un propietario con ID: " + inmuebleDTO.getPropietarioId(),
                    HttpStatus.BAD_REQUEST
                );
            }
        }

        Inmueble inmueble = inmuebleDTO.toEntity();

        // Actualizar esAlquilado basado en el estado
        actualizarEsAlquiladoSegunEstado(inmueble);

        Inmueble inmuebleGuardado = inmuebleRepository.save(inmueble);
        return new InmuebleDTO(inmuebleGuardado);
    }

    // Actualizar inmueble
    @Transactional
    @CacheEvict(
        allEntries = true,
        cacheNames = {
            CacheNames.CONTRATOS,
            CacheNames.CONTRATOS_VIGENTES,
            CacheNames.CONTRATOS_NO_VIGENTES,
            CacheNames.CONTRATOS_PROXIMOS_VENCER,
            CacheNames.CONTRATOS_POR_INMUEBLE,
            CacheNames.INMUEBLE_TIENE_CONTRATO_VIGENTE
        }
    )
    public InmuebleDTO actualizarInmueble(Long id, InmuebleDTO inmuebleDTO) {
        Optional<Inmueble> inmuebleExistente = inmuebleRepository.findById(id);

        if (inmuebleExistente.isEmpty()) {
            throw new BusinessException(
                ErrorCodes.INMUEBLE_NO_ENCONTRADO,
                "No se encontró el inmueble con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }

        Inmueble inmueble = inmuebleExistente.get();

        // Validar si se intenta cambiar el estado a "Disponible" cuando hay un contrato activo
        if (inmuebleDTO.getEstado() != null && !inmuebleDTO.getEstado().equals(inmueble.getEstado())) {
            Optional<EstadoInmueble> nuevoEstado = estadoInmuebleRepository.findById(inmuebleDTO.getEstado());
            if (nuevoEstado.isPresent() && "Disponible".equals(nuevoEstado.get().getNombre())) {
                // Verificar si el inmueble tiene contratos vigentes
                boolean tieneContratoVigente = contratoRepository.existsContratoVigenteByInmueble(inmueble);
                if (tieneContratoVigente) {
                    throw new BusinessException(
                        ErrorCodes.INMUEBLE_YA_ALQUILADO,
                        "No se puede cambiar el estado a 'Disponible' porque el inmueble tiene un contrato vigente asociado",
                        HttpStatus.BAD_REQUEST
                    );
                }
            }
        }

        inmueble.setPropietarioId(inmuebleDTO.getPropietarioId());
        inmueble.setDireccion(inmuebleDTO.getDireccion());
        inmueble.setTipoInmuebleId(inmuebleDTO.getTipoInmuebleId());
        inmueble.setEstado(inmuebleDTO.getEstado());
        inmueble.setSuperficie(inmuebleDTO.getSuperficie());
        inmueble.setEsActivo(inmuebleDTO.getEsActivo());

        // Actualizar esAlquilado basado en el estado
        actualizarEsAlquiladoSegunEstado(inmueble);

        Inmueble inmuebleActualizado = inmuebleRepository.save(inmueble);
        return new InmuebleDTO(inmuebleActualizado);
    }

    // Método auxiliar para actualizar esAlquilado según el estado
    private void actualizarEsAlquiladoSegunEstado(Inmueble inmueble) {
        if (inmueble.getEstado() != null) {
            Optional<EstadoInmueble> estadoInmueble = estadoInmuebleRepository.findById(inmueble.getEstado());
            if (estadoInmueble.isPresent()) {
                boolean esAlquilado = "Alquilado".equals(estadoInmueble.get().getNombre());
                inmueble.setEsAlquilado(esAlquilado);
            }
        }
    }

    // Eliminar inmueble (borrado lógico)
    @Transactional
    @CacheEvict(
        allEntries = true,
        cacheNames = {
            CacheNames.CONTRATOS,
            CacheNames.CONTRATOS_VIGENTES,
            CacheNames.CONTRATOS_NO_VIGENTES,
            CacheNames.CONTRATOS_PROXIMOS_VENCER,
            CacheNames.CONTRATOS_POR_INMUEBLE,
            CacheNames.INMUEBLE_TIENE_CONTRATO_VIGENTE
        }
    )
    public void eliminarInmueble(Long id) {
        Optional<Inmueble> inmueble = inmuebleRepository.findById(id);
        if (inmueble.isEmpty()) {
            throw new BusinessException(
                ErrorCodes.INMUEBLE_NO_ENCONTRADO,
                "No se encontró el inmueble con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }

        Inmueble i = inmueble.get();

        // Validar que el inmueble no tenga contratos vigentes
        boolean tieneContratosVigentes = contratoRepository.existsContratoVigenteByInmueble(i);
        if (tieneContratosVigentes) {
            throw new BusinessException(
                ErrorCodes.INMUEBLE_TIENE_CONTRATOS_VIGENTES,
                "No se puede eliminar el inmueble porque tiene contratos vigentes asociados",
                HttpStatus.BAD_REQUEST
            );
        }

        // Proceder con la eliminación lógica
        i.setEsActivo(false);

        // Cambiar el estado del inmueble a "Inactivo"
        Optional<EstadoInmueble> estadoInactivo = estadoInmuebleRepository.findByNombre("Inactivo");
        if (estadoInactivo.isPresent()) {
            i.setEstado(estadoInactivo.get().getId());
            i.setEsAlquilado(false); // Un inmueble inactivo no puede estar alquilado
        }

        inmuebleRepository.save(i);
    }

    /**
     * Desactiva todos los inmuebles de un propietario
     * Cambia el estado a "Inactivo" y setea esActivo = false
     *
     * @param propietarioId ID del propietario
     * @return Cantidad de inmuebles desactivados
     */
    @Transactional
    @CacheEvict(
        allEntries = true,
        cacheNames = {
            CacheNames.CONTRATOS,
            CacheNames.CONTRATOS_VIGENTES,
            CacheNames.CONTRATOS_NO_VIGENTES,
            CacheNames.CONTRATOS_PROXIMOS_VENCER,
            CacheNames.CONTRATOS_POR_INMUEBLE,
            CacheNames.INMUEBLE_TIENE_CONTRATO_VIGENTE
        }
    )
    public int desactivarInmueblesPorPropietario(Long propietarioId) {
        // Obtener el estado "Inactivo"
        EstadoInmueble estadoInactivo = estadoInmuebleRepository.findByNombre("Inactivo")
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.ESTADO_INMUEBLE_NO_ENCONTRADO,
                "Estado 'Inactivo' no encontrado en el sistema",
                HttpStatus.INTERNAL_SERVER_ERROR
            ));

        // Obtener todos los inmuebles del propietario y desactivarlos
        List<Inmueble> inmuebles = inmuebleRepository.findByPropietarioId(propietarioId);
        for (Inmueble inmueble : inmuebles) {
            inmueble.setEsActivo(false);
            inmueble.setEstado(estadoInactivo.getId());
            inmuebleRepository.save(inmueble);
        }

        return inmuebles.size();
    }

    // Marcar inmueble como alquilado
    @Transactional
    @CacheEvict(
        allEntries = true,
        cacheNames = {
            CacheNames.CONTRATOS,
            CacheNames.CONTRATOS_VIGENTES,
            CacheNames.CONTRATOS_NO_VIGENTES,
            CacheNames.CONTRATOS_PROXIMOS_VENCER,
            CacheNames.CONTRATOS_POR_INMUEBLE,
            CacheNames.INMUEBLE_TIENE_CONTRATO_VIGENTE
        }
    )
    public InmuebleDTO marcarComoAlquilado(Long id) {
        Optional<Inmueble> inmueble = inmuebleRepository.findById(id);
        if (inmueble.isPresent()) {
            Inmueble i = inmueble.get();
            if (i.getEsAlquilado()) {
                throw new BusinessException(
                    ErrorCodes.INMUEBLE_YA_ALQUILADO,
                    "El inmueble ya se encuentra alquilado"
                );
            }
            i.setEsAlquilado(true);
            Inmueble inmuebleActualizado = inmuebleRepository.save(i);
            return new InmuebleDTO(inmuebleActualizado);
        } else {
            throw new BusinessException(
                ErrorCodes.INMUEBLE_NO_ENCONTRADO,
                "No se encontró el inmueble con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }
    }

    // Marcar inmueble como disponible
    @Transactional
    @CacheEvict(
        allEntries = true,
        cacheNames = {
            CacheNames.CONTRATOS,
            CacheNames.CONTRATOS_VIGENTES,
            CacheNames.CONTRATOS_NO_VIGENTES,
            CacheNames.CONTRATOS_PROXIMOS_VENCER,
            CacheNames.CONTRATOS_POR_INMUEBLE,
            CacheNames.INMUEBLE_TIENE_CONTRATO_VIGENTE
        }
    )
    public InmuebleDTO marcarComoDisponible(Long id) {
        Optional<Inmueble> inmueble = inmuebleRepository.findById(id);
        if (inmueble.isPresent()) {
            Inmueble i = inmueble.get();
            i.setEsAlquilado(false);
            Inmueble inmuebleActualizado = inmuebleRepository.save(i);
            return new InmuebleDTO(inmuebleActualizado);
        } else {
            throw new BusinessException(
                ErrorCodes.INMUEBLE_NO_ENCONTRADO,
                "No se encontró el inmueble con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }
    }

    // Cambiar estado de alquiler (método usado por el controller)
    @Transactional
    @CacheEvict(
        allEntries = true,
        cacheNames = {
            CacheNames.CONTRATOS,
            CacheNames.CONTRATOS_VIGENTES,
            CacheNames.CONTRATOS_NO_VIGENTES,
            CacheNames.CONTRATOS_PROXIMOS_VENCER,
            CacheNames.CONTRATOS_POR_INMUEBLE,
            CacheNames.INMUEBLE_TIENE_CONTRATO_VIGENTE
        }
    )
    public InmuebleDTO cambiarEstadoAlquiler(Long id, Boolean esAlquilado) {
        if (esAlquilado) {
            return marcarComoAlquilado(id);
        } else {
            return marcarComoDisponible(id);
        }
    }

    // Cambiar tipo de inmueble
    @Transactional
    @CacheEvict(
        allEntries = true,
        cacheNames = {
            CacheNames.CONTRATOS,
            CacheNames.CONTRATOS_VIGENTES,
            CacheNames.CONTRATOS_NO_VIGENTES,
            CacheNames.CONTRATOS_PROXIMOS_VENCER,
            CacheNames.CONTRATOS_POR_INMUEBLE,
            CacheNames.INMUEBLE_TIENE_CONTRATO_VIGENTE
        }
    )
    public InmuebleDTO cambiarTipoInmueble(Long id, Long tipoInmuebleId) {
        // Verificar que existe el inmueble
        Optional<Inmueble> inmuebleExistente = inmuebleRepository.findById(id);
        if (inmuebleExistente.isEmpty()) {
            throw new BusinessException(ErrorCodes.INMUEBLE_NO_ENCONTRADO, "Inmueble no encontrado con ID: " + id, HttpStatus.NOT_FOUND);
        }

        Inmueble inmueble = inmuebleExistente.get();

        // Verificar que el inmueble no esté en un contrato vigente usando el repositorio de contratos
        boolean tieneContratoVigente = contratoRepository.existsContratoVigenteByInmueble(inmueble);
        if (tieneContratoVigente) {
            throw new BusinessException(ErrorCodes.INMUEBLE_YA_ALQUILADO,
                "No se puede cambiar el tipo del inmueble porque tiene un contrato vigente asociado", HttpStatus.BAD_REQUEST);
        }

        // Validar que existe el tipo de inmueble
        Optional<TipoInmueble> tipoInmueble = tipoInmuebleRepository.findById(tipoInmuebleId);
        if (tipoInmueble.isEmpty()) {
            throw new BusinessException(ErrorCodes.TIPO_INMUEBLE_NO_ENCONTRADO,
                "No existe el tipo de inmueble con ID: " + tipoInmuebleId, HttpStatus.BAD_REQUEST);
        }

        // Actualizar el tipo de inmueble
        inmueble.setTipoInmuebleId(tipoInmuebleId);

        Inmueble inmuebleActualizado = inmuebleRepository.save(inmueble);
        return new InmuebleDTO(inmuebleActualizado);
    }

    // Alias para desactivar inmueble (método usado por el controller)
    public void desactivarInmueble(Long id) {
        eliminarInmueble(id);
    }

    // Activar inmueble (reactivación)
    @Transactional
    @CacheEvict(
        allEntries = true,
        cacheNames = {
            CacheNames.CONTRATOS,
            CacheNames.CONTRATOS_VIGENTES,
            CacheNames.CONTRATOS_NO_VIGENTES,
            CacheNames.CONTRATOS_PROXIMOS_VENCER,
            CacheNames.CONTRATOS_POR_INMUEBLE,
            CacheNames.INMUEBLE_TIENE_CONTRATO_VIGENTE
        }
    )
    public void activarInmueble(Long id) {
        Optional<Inmueble> inmueble = inmuebleRepository.findById(id);
        if (inmueble.isEmpty()) {
            throw new BusinessException(
                ErrorCodes.INMUEBLE_NO_ENCONTRADO,
                "No se encontró el inmueble con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }

        Inmueble i = inmueble.get();
        i.setEsActivo(true);
        inmuebleRepository.save(i);
    }

    // Metodo que se usa cuando se da de baja un contrato automaticamente
    // Cambia el estado del inmueble a Disponible y esAlquilado = false
    @Transactional
    @CacheEvict(
        allEntries = true,
        cacheNames = {
            CacheNames.CONTRATOS,
            CacheNames.CONTRATOS_VIGENTES,
            CacheNames.CONTRATOS_NO_VIGENTES,
            CacheNames.CONTRATOS_PROXIMOS_VENCER,
            CacheNames.CONTRATOS_POR_INMUEBLE,
            CacheNames.INMUEBLE_TIENE_CONTRATO_VIGENTE
        }
    )
    public void actualizarEstadoInmueble(Inmueble i) {
        Optional<EstadoInmueble> estadoInmuebleDisponible = estadoInmuebleRepository.findByNombre("Disponible");
        if (estadoInmuebleDisponible.isEmpty()) {
            throw new BusinessException(
                ErrorCodes.ESTADO_INMUEBLE_NO_ENCONTRADO,
                "Estado 'Disponible' no encontrado en el sistema",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
        i.setEstado(estadoInmuebleDisponible.get().getId());
        i.setEsAlquilado(false);
    }
}
