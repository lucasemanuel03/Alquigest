package com.alquileres.service;

import com.alquileres.dto.PropietarioDTO;
import com.alquileres.model.Propietario;
import com.alquileres.repository.PropietarioRepository;
import com.alquileres.repository.ContratoRepository;
import com.alquileres.security.EncryptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.alquileres.exception.BusinessException;
import com.alquileres.exception.ErrorCodes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PropietarioService {

    private static final Logger logger = LoggerFactory.getLogger(PropietarioService.class);

    @Autowired
    private PropietarioRepository propietarioRepository;

    @Autowired
    private InmuebleService inmuebleService;

    @Autowired
    private ContratoRepository contratoRepository;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private com.alquileres.repository.UsuarioRepository usuarioRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    // Obtener todos los propietarios
    public List<PropietarioDTO> obtenerTodosLosPropietarios() {
        List<Propietario> propietarios = propietarioRepository.findAll();
        return propietarios.stream()
                .map(p -> {
                    PropietarioDTO dto = new PropietarioDTO(p);
                    desencriptarClaveFiscal(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // Obtener solo propietarios activos
    public List<PropietarioDTO> obtenerPropietariosActivos() {
        List<Propietario> propietarios = propietarioRepository.findByEsActivoTrue();
        return propietarios.stream()
                .map(p -> {
                    PropietarioDTO dto = new PropietarioDTO(p);
                    desencriptarClaveFiscal(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // Obtener solo los propietarios inactivos
    public List<PropietarioDTO> obtenerPropietariosInactivos() {
        List<Propietario> propietarios = propietarioRepository.findByEsActivoFalse();
        return propietarios.stream()
                .map(p -> {
                    PropietarioDTO dto = new PropietarioDTO(p);
                    desencriptarClaveFiscal(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // Contar propietarios activos
    public Long contarPropietariosActivos() {
        return propietarioRepository.countByEsActivoTrue();
    }

    // Obtener propietario por ID
    public PropietarioDTO obtenerPropietarioPorId(Long id) {
        Optional<Propietario> propietario = propietarioRepository.findById(id);
        if (propietario.isPresent()) {
            PropietarioDTO dto = new PropietarioDTO(propietario.get());
            // Desencriptar clave fiscal
            desencriptarClaveFiscal(dto);
            return dto;
        } else {
            throw new BusinessException(
                ErrorCodes.PROPIETARIO_NO_ENCONTRADO,
                "No se encontró el propietario con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }
    }

    // Buscar propietario por CUIL
    public PropietarioDTO buscarPorCuil(String cuil) {
        Optional<Propietario> propietario = propietarioRepository.findByCuil(cuil);
        if (propietario.isPresent()) {
            PropietarioDTO dto = new PropietarioDTO(propietario.get());
            desencriptarClaveFiscal(dto);
            return dto;
        } else {
            throw new BusinessException(
                ErrorCodes.PROPIETARIO_NO_ENCONTRADO,
                "No se encontró el propietario con CUIL: " + cuil,
                HttpStatus.NOT_FOUND
            );
        }
    }

    // Buscar propietarios por nombre y apellido
    public List<PropietarioDTO> buscarPorNombreYApellido(String nombre, String apellido) {
        List<Propietario> propietarios = propietarioRepository
                .findByNombreContainingIgnoreCaseAndApellidoContainingIgnoreCase(
                        nombre != null ? nombre : "",
                        apellido != null ? apellido : ""
                );
        return propietarios.stream()
                .map(p -> {
                    PropietarioDTO dto = new PropietarioDTO(p);
                    desencriptarClaveFiscal(dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // Crear nuevo propietario
    public PropietarioDTO crearPropietario(PropietarioDTO propietarioDTO) {
        // Validar CUIL único
        if (propietarioRepository.findByCuil(propietarioDTO.getCuil()).isPresent()) {
            throw new BusinessException(
                ErrorCodes.DNI_DUPLICADO,
                "El CUIL ya se encuentra registrado"
            );
        }

        // Validar email único si se proporciona
        if (propietarioDTO.getEmail() != null && !propietarioDTO.getEmail().trim().isEmpty()) {
            if (propietarioRepository.findByEmail(propietarioDTO.getEmail()).isPresent()) {
                throw new BusinessException(
                    ErrorCodes.EMAIL_DUPLICADO,
                    "El email ya se encuentra registrado"
                );
            }
        }

        Propietario propietario = propietarioDTO.toEntity();

        // Encriptar clave fiscal si se proporciona
        if (propietario.getClaveFiscal() != null && !propietario.getClaveFiscal().trim().isEmpty()) {
            try {
                propietario.setClaveFiscal(encryptionService.encriptar(propietario.getClaveFiscal()));
            } catch (Exception e) {
                logger.error("Error encriptando clave fiscal", e);
                throw new BusinessException(
                    ErrorCodes.ERROR_INTERNO,
                    "Error al procesar la clave fiscal"
                );
            }
        }

        Propietario propietarioGuardado = propietarioRepository.save(propietario);

        // Desencriptar clave fiscal para devolver en DTO
        PropietarioDTO dto = new PropietarioDTO(propietarioGuardado);
        if (dto.getClaveFiscal() != null && !dto.getClaveFiscal().trim().isEmpty()) {
            try {
                dto.setClaveFiscal(encryptionService.desencriptar(dto.getClaveFiscal()));
            } catch (Exception e) {
                logger.error("Error desencriptando clave fiscal", e);
                dto.setClaveFiscal(null);
            }
        }

        return dto;
    }

    // Actualizar propietario
    public PropietarioDTO actualizarPropietario(Long id, PropietarioDTO propietarioDTO) {
        Optional<Propietario> propietarioExistente = propietarioRepository.findById(id);

        if (propietarioExistente.isEmpty()) {
            throw new BusinessException(
                ErrorCodes.PROPIETARIO_NO_ENCONTRADO,
                "No se encontró el propietario con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }

        // Validar CUIL único (excluyendo el propietario actual)
        if (propietarioRepository.existsByCuilAndIdNot(propietarioDTO.getCuil(), id)) {
            throw new BusinessException(
                ErrorCodes.DNI_DUPLICADO,
                "Ya existe otro propietario con ese CUIL"
            );
        }

        // Validar email único si se proporciona (excluyendo el propietario actual)
        if (propietarioDTO.getEmail() != null && !propietarioDTO.getEmail().trim().isEmpty()) {
            if (propietarioRepository.existsByEmailAndIdNot(propietarioDTO.getEmail(), id)) {
                throw new BusinessException(
                    ErrorCodes.EMAIL_DUPLICADO,
                    "Ya existe otro propietario con ese email"
                );
            }
        }

        Propietario propietario = propietarioExistente.get();

        // Actualizar campos
        propietario.setNombre(propietarioDTO.getNombre());
        propietario.setApellido(propietarioDTO.getApellido());
        propietario.setCuil(propietarioDTO.getCuil());
        propietario.setTelefono(propietarioDTO.getTelefono());
        propietario.setEmail(propietarioDTO.getEmail());
        propietario.setDireccion(propietarioDTO.getDireccion());
        propietario.setBarrio(propietarioDTO.getBarrio());

        // Encriptar clave fiscal si se proporciona
        if (propietarioDTO.getClaveFiscal() != null && !propietarioDTO.getClaveFiscal().trim().isEmpty()) {
            try {
                propietario.setClaveFiscal(encryptionService.encriptar(propietarioDTO.getClaveFiscal()));
            } catch (Exception e) {
                logger.error("Error encriptando clave fiscal", e);
                throw new BusinessException(
                    ErrorCodes.ERROR_INTERNO,
                    "Error al procesar la clave fiscal"
                );
            }
        } else {
            propietario.setClaveFiscal(null);
        }

        if (propietarioDTO.getEsActivo() != null) {
            propietario.setEsActivo(propietarioDTO.getEsActivo());
        }

        Propietario propietarioActualizado = propietarioRepository.save(propietario);
        PropietarioDTO dto = new PropietarioDTO(propietarioActualizado);
        desencriptarClaveFiscal(dto);
        return dto;
    }

    // Eliminar propietario (eliminación lógica)
    @Transactional
    public void desactivarPropietario(Long id) {
        Optional<Propietario> propietario = propietarioRepository.findById(id);

        if (propietario.isEmpty()) {
            throw new BusinessException(
                ErrorCodes.PROPIETARIO_NO_ENCONTRADO,
                "No se encontró el propietario con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }

        // Validar que el propietario no tenga contratos vigentes en sus inmuebles
        boolean tieneContratosVigentes = contratoRepository.existsContratoVigenteByPropietario(id);
        if (tieneContratosVigentes) {
            throw new BusinessException(
                ErrorCodes.PROPIETARIO_TIENE_CONTRATOS_VIGENTES,
                "No se puede dar de baja al propietario porque tiene inmuebles con contratos vigentes asociados",
                HttpStatus.BAD_REQUEST
            );
        }

        // Desactivar propietario
        Propietario prop = propietario.get();
        prop.setEsActivo(false);
        propietarioRepository.save(prop);

        // Desactivar todos los inmuebles del propietario
        int inmueblesDesactivados = inmuebleService.desactivarInmueblesPorPropietario(id);

        logger.info("Propietario ID {} desactivado. Se desactivaron {} inmuebles.", id, inmueblesDesactivados);
    }

    // Activar propietario (reactivación)
    public void activarPropietario(Long id) {
        Optional<Propietario> propietario = propietarioRepository.findById(id);

        if (propietario.isEmpty()) {
            throw new BusinessException(
                ErrorCodes.PROPIETARIO_NO_ENCONTRADO,
                "No se encontró el propietario con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }

        Propietario prop = propietario.get();
        prop.setEsActivo(true);
        propietarioRepository.save(prop);
    }

    /**
     * Método auxiliar para enmascarar la clave fiscal en un DTO
     * Muestra solo los últimos 4 caracteres
     *
     * @param dto El DTO de propietario cuya clave fiscal será enmascarada
     */
    private void desencriptarClaveFiscal(PropietarioDTO dto) {
        if (dto != null && dto.getClaveFiscal() != null && !dto.getClaveFiscal().trim().isEmpty()) {
            try {
                // Desencriptar para obtener la longitud real
                String claveDesencriptada = encryptionService.desencriptar(dto.getClaveFiscal());
                int length = claveDesencriptada.length();

                // Enmascarar mostrando solo los últimos 4 caracteres
                if (length <= 4) {
                    dto.setClaveFiscal("****");
                } else {
                    String ultimosCuatro = claveDesencriptada.substring(length - 4);
                    dto.setClaveFiscal("*".repeat(length - 4) + ultimosCuatro);
                }
            } catch (Exception e) {
                logger.error("Error procesando clave fiscal para propietario ID: {}", dto.getId(), e);
                dto.setClaveFiscal(null);
            }
        }
    }

    /**
     * Obtiene la clave fiscal desencriptada de un propietario
     * Este método es SOLO para uso interno del backend
     *
     * @param propietarioId ID del propietario
     * @return Clave fiscal desencriptada
     * @throws BusinessException si el propietario no existe o no tiene clave fiscal
     */
    public String obtenerClaveFiscalDesencriptada(Long propietarioId) {
        Propietario propietario = propietarioRepository.findById(propietarioId)
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.PROPIETARIO_NO_ENCONTRADO,
                "Propietario no encontrado con ID: " + propietarioId,
                HttpStatus.NOT_FOUND
            ));

        if (propietario.getClaveFiscal() == null || propietario.getClaveFiscal().trim().isEmpty()) {
            throw new BusinessException(
                ErrorCodes.DATOS_INCOMPLETOS,
                "El propietario no tiene clave fiscal configurada",
                HttpStatus.BAD_REQUEST
            );
        }

        try {
            return encryptionService.desencriptar(propietario.getClaveFiscal());
        } catch (Exception e) {
            logger.error("Error desencriptando clave fiscal para propietario ID: {}", propietarioId, e);
            throw new BusinessException(
                ErrorCodes.ERROR_INTERNO,
                "Error al procesar la clave fiscal",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Revela la clave fiscal completa desencriptada
     * Requiere autenticación del usuario
     *
     * @param propietarioId ID del propietario
     * @param username Usuario que solicita la clave
     * @param password Contraseña del usuario para validación
     * @param ipAddress Dirección IP desde donde se hace la solicitud
     * @return Clave fiscal desencriptada
     * @throws BusinessException si las credenciales son inválidas
     */
    @Transactional(readOnly = true)
    public String revelarClaveFiscal(Long propietarioId, String username, String password, String ipAddress) {
        // Validar que el usuario existe
        com.alquileres.model.Usuario usuario = usuarioRepository.findByUsername(username)
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.VALIDACION_ERROR,
                "Usuario no encontrado",
                HttpStatus.UNAUTHORIZED
            ));

        // Validar la contraseña
        if (!passwordEncoder.matches(password, usuario.getPassword())) {
            logger.warn("⚠️ Intento fallido de revelar clave fiscal - Usuario: {}, IP: {}", username, ipAddress);
            throw new BusinessException(
                ErrorCodes.VALIDACION_ERROR,
                "Contraseña incorrecta",
                HttpStatus.UNAUTHORIZED
            );
        }

        // Obtener clave fiscal desencriptada
        String claveFiscal = obtenerClaveFiscalDesencriptada(propietarioId);

        // Registrar en log de auditoría
        logger.warn("⚠️ CLAVE FISCAL REVELADA - Propietario ID: {}, Usuario: {}, IP: {}",
                    propietarioId, username, ipAddress);

        return claveFiscal;
    }
}
