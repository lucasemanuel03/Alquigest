package com.alquileres.service;

import com.alquileres.dto.InquilinoDTO;
import com.alquileres.model.Inquilino;
import com.alquileres.repository.InquilinoRepository;
import com.alquileres.repository.ContratoRepository;
import com.alquileres.exception.BusinessException;
import com.alquileres.exception.ErrorCodes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InquilinoService {

    @Autowired
    private InquilinoRepository inquilinoRepository;

    @Autowired
    private ContratoRepository contratoRepository;

    // Obtener todos los inquilinos
    @Cacheable(value = "inquilinos", key = "'all'")
    public List<InquilinoDTO> obtenerTodosLosInquilinos() {
        List<Inquilino> inquilinos = inquilinoRepository.findAll();
        return inquilinos.stream()
                .map(InquilinoDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener solo inquilinos activos
    @Cacheable(value = "inquilinos", key = "'activos'")
    public List<InquilinoDTO> obtenerInquilinosActivos() {
        List<Inquilino> inquilinos = inquilinoRepository.findByEsActivoTrue();
        return inquilinos.stream()
                .map(InquilinoDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener solo inquilinos inactivos
    @Cacheable(value = "inquilinos", key = "'inactivos'")
    public List<InquilinoDTO> obtenerInquilinosInactivos() {
        List<Inquilino> inquilinos = inquilinoRepository.findByEsActivoFalse();
        return inquilinos.stream()
                .map(InquilinoDTO::new)
                .collect(Collectors.toList());
    }

    // Contar inquilinos activos
    @Cacheable(value = "inquilinos", key = "'count_activos'")
    public Long contarInquilinosActivos() {
        return inquilinoRepository.countByEsActivoTrue();
    }

    // Obtener inquilinos que están alquilando
    @Cacheable(value = "inquilinos", key = "'alquilando'")
    public List<InquilinoDTO> obtenerInquilinosAlquilando() {
        List<Inquilino> inquilinos = inquilinoRepository.findByEstaAlquilandoTrue();
        return inquilinos.stream()
                .map(InquilinoDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener inquilinos que no están alquilando
    @Cacheable(value = "inquilinos", key = "'no_alquilando'")
    public List<InquilinoDTO> obtenerInquilinosNoAlquilando() {
        List<Inquilino> inquilinos = inquilinoRepository.findByEstaAlquilandoFalse();
        return inquilinos.stream()
                .map(InquilinoDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener inquilino por ID
    @Cacheable(value = "inquilinos", key = "#id")
    public InquilinoDTO obtenerInquilinoPorId(Long id) {
        Optional<Inquilino> inquilino = inquilinoRepository.findById(id);
        if (inquilino.isPresent()) {
            return new InquilinoDTO(inquilino.get());
        } else {
            throw new BusinessException(
                ErrorCodes.INQUILINO_NO_ENCONTRADO,
                "No se encontró el inquilino con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }
    }

    // Buscar inquilino por CUIL
    public InquilinoDTO buscarPorCuil(String cuil) {
        Optional<Inquilino> inquilino = inquilinoRepository.findByCuil(cuil);
        if (inquilino.isPresent()) {
            return new InquilinoDTO(inquilino.get());
        } else {
            throw new BusinessException(
                ErrorCodes.INQUILINO_NO_ENCONTRADO,
                "No se encontró el inquilino con CUIL: " + cuil,
                HttpStatus.NOT_FOUND
            );
        }
    }

    // Buscar inquilinos por nombre
    public List<InquilinoDTO> buscarPorNombre(String nombre) {
        List<Inquilino> inquilinos = inquilinoRepository.findByNombreContainingIgnoreCase(nombre);
        return inquilinos.stream()
                .map(InquilinoDTO::new)
                .collect(Collectors.toList());
    }

    // Crear nuevo inquilino
    @CacheEvict(value = "inquilinos", allEntries = true)
    public InquilinoDTO crearInquilino(InquilinoDTO inquilinoDTO) {
        // Validar CUIL único si se proporciona
        if (inquilinoDTO.getCuil() != null && !inquilinoDTO.getCuil().trim().isEmpty()) {
            if (inquilinoRepository.findByCuil(inquilinoDTO.getCuil()).isPresent()) {
                throw new BusinessException(
                    ErrorCodes.CUIL_DUPLICADO,
                    "El CUIL ya se encuentra registrado"
                );
            }
        }

        Inquilino inquilino = inquilinoDTO.toEntity();
        Inquilino inquilinoGuardado = inquilinoRepository.save(inquilino);
        return new InquilinoDTO(inquilinoGuardado);
    }

    // Actualizar inquilino
    @CacheEvict(value = "inquilinos", allEntries = true)
    public InquilinoDTO actualizarInquilino(Long id, InquilinoDTO inquilinoDTO) {
        Optional<Inquilino> inquilinoExistente = inquilinoRepository.findById(id);

        if (inquilinoExistente.isEmpty()) {
            throw new BusinessException(
                ErrorCodes.INQUILINO_NO_ENCONTRADO,
                "No se encontró el inquilino con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }

        // Validar CUIL único si se proporciona (excluyendo el inquilino actual)
        if (inquilinoDTO.getCuil() != null && !inquilinoDTO.getCuil().trim().isEmpty()) {
            if (inquilinoRepository.existsByCuilAndIdNot(inquilinoDTO.getCuil(), id)) {
                throw new BusinessException(
                    ErrorCodes.CUIL_DUPLICADO,
                    "Ya existe otro inquilino con ese CUIL"
                );
            }
        }

        Inquilino inquilino = inquilinoExistente.get();
        inquilino.setNombre(inquilinoDTO.getNombre());
        inquilino.setApellido(inquilinoDTO.getApellido());
        inquilino.setCuil(inquilinoDTO.getCuil());
        inquilino.setTelefono(inquilinoDTO.getTelefono());
        inquilino.setEsActivo(inquilinoDTO.getEsActivo());

        Inquilino inquilinoActualizado = inquilinoRepository.save(inquilino);
        return new InquilinoDTO(inquilinoActualizado);
    }

    // Eliminar inquilino (borrado lógico)
    @CacheEvict(value = "inquilinos", allEntries = true)
    public void desactivarInquilino(Long id) {
        Optional<Inquilino> inquilino = inquilinoRepository.findById(id);
        if (inquilino.isEmpty()) {
            throw new BusinessException(
                ErrorCodes.INQUILINO_NO_ENCONTRADO,
                "No se encontró el inquilino con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }

        Inquilino i = inquilino.get();

        // Validar que el inquilino no tenga contratos vigentes
        boolean tieneContratosVigentes = contratoRepository.existsContratoVigenteByInquilino(i);
        if (tieneContratosVigentes) {
            throw new BusinessException(
                ErrorCodes.INQUILINO_TIENE_CONTRATOS_VIGENTES,
                "No se puede eliminar el inquilino porque tiene contratos vigentes asociados",
                HttpStatus.BAD_REQUEST
            );
        }

        // Proceder con la eliminación lógica
        i.setEsActivo(false);
        inquilinoRepository.save(i);
    }

    // Activar inquilino (reactivación)
    public void activarInquilino(Long id) {
        Optional<Inquilino> inquilino = inquilinoRepository.findById(id);
        if (!inquilino.isPresent()) {
            throw new BusinessException(
                ErrorCodes.INQUILINO_NO_ENCONTRADO,
                "No se encontró el inquilino con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }

        Inquilino i = inquilino.get();
        i.setEsActivo(true);
        inquilinoRepository.save(i);
    }
}
