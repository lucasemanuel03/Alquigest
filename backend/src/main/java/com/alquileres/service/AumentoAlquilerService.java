package com.alquileres.service;

import com.alquileres.dto.AumentoAlquilerDTO;
import com.alquileres.exception.BusinessException;
import com.alquileres.exception.ErrorCodes;
import com.alquileres.model.AumentoAlquiler;
import com.alquileres.model.Contrato;
import com.alquileres.repository.AumentoAlquilerRepository;
import com.alquileres.repository.ContratoRepository;
import com.alquileres.util.FechaUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AumentoAlquilerService {

    @Autowired
    private AumentoAlquilerRepository aumentoAlquilerRepository;

    @Autowired
    private ContratoRepository contratoRepository;

    @Autowired
    private ClockService clockService;

    /**
     * Obtener el historial completo de aumentos de un contrato
     */
    public List<AumentoAlquilerDTO> obtenerHistorialAumentos(Long contratoId) {
        // Validar que el contrato existe
        if (!contratoRepository.existsById(contratoId)) {
            throw new BusinessException(
                ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "No se encontró el contrato con ID: " + contratoId,
                HttpStatus.NOT_FOUND
            );
        }

        List<AumentoAlquiler> aumentos = aumentoAlquilerRepository.findByContratoIdOrderByFechaAumentoDesc(contratoId);
        return aumentos.stream()
                .map(AumentoAlquilerDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Obtener un aumento específico por su ID
     */
    public AumentoAlquilerDTO obtenerAumentoPorId(Long id) {
        Optional<AumentoAlquiler> aumento = aumentoAlquilerRepository.findById(id);
        if (!aumento.isPresent()) {
            throw new BusinessException(
                ErrorCodes.RECURSO_NO_ENCONTRADO,
                "No se encontró el aumento con ID: " + id,
                HttpStatus.NOT_FOUND
            );
        }
        return new AumentoAlquilerDTO(aumento.get());
    }

    /**
     * Registrar un nuevo aumento de alquiler manualmente
     */
    @Transactional
    public AumentoAlquilerDTO registrarAumento(Long contratoId, AumentoAlquilerDTO aumentoDTO) {
        // Validar que el contrato existe
        Optional<Contrato> contratoOpt = contratoRepository.findById(contratoId);
        if (!contratoOpt.isPresent()) {
            throw new BusinessException(
                ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "No se encontró el contrato con ID: " + contratoId,
                HttpStatus.NOT_FOUND
            );
        }

        Contrato contrato = contratoOpt.get();

        // Validar datos del aumento
        if (aumentoDTO.getFechaAumento() == null || aumentoDTO.getFechaAumento().isEmpty()) {
            throw new BusinessException(
                ErrorCodes.DATOS_INCOMPLETOS,
                "La fecha del aumento es obligatoria",
                HttpStatus.BAD_REQUEST
            );
        }

        if (aumentoDTO.getMontoAnterior() == null || aumentoDTO.getMontoNuevo() == null) {
            throw new BusinessException(
                ErrorCodes.DATOS_INCOMPLETOS,
                "Los montos anterior y nuevo son obligatorios",
                HttpStatus.BAD_REQUEST
            );
        }

        if (aumentoDTO.getMontoNuevo().compareTo(aumentoDTO.getMontoAnterior()) <= 0) {
            throw new BusinessException(
                ErrorCodes.DATOS_INVALIDOS,
                "El monto nuevo debe ser mayor al monto anterior",
                HttpStatus.BAD_REQUEST
            );
        }

        // Calcular porcentaje de aumento si no se proporciona
        BigDecimal porcentajeAumento = aumentoDTO.getPorcentajeAumento();
        if (porcentajeAumento == null) {
            // Calcular: ((montoNuevo - montoAnterior) / montoAnterior) * 100
            porcentajeAumento = aumentoDTO.getMontoNuevo()
                    .subtract(aumentoDTO.getMontoAnterior())
                    .divide(aumentoDTO.getMontoAnterior(), 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(new BigDecimal("100"));
        }

        // Crear el aumento
        AumentoAlquiler aumento = new AumentoAlquiler();
        aumento.setContrato(contrato);
        aumento.setFechaAumento(aumentoDTO.getFechaAumento());
        aumento.setMontoAnterior(aumentoDTO.getMontoAnterior());
        aumento.setMontoNuevo(aumentoDTO.getMontoNuevo());
        aumento.setPorcentajeAumento(porcentajeAumento);
        aumento.setDescripcion(aumentoDTO.getDescripcion());
        aumento.setCreatedAt(LocalDateTime.now().toString());

        AumentoAlquiler aumentoGuardado = aumentoAlquilerRepository.save(aumento);
        return new AumentoAlquilerDTO(aumentoGuardado);
    }

    /**
     * Registrar automáticamente un aumento cuando se aplica en el sistema
     */
    @Transactional
    public AumentoAlquilerDTO registrarAumentoAutomatico(Contrato contrato, BigDecimal montoAnterior,
                                                         BigDecimal montoNuevo, BigDecimal porcentajeAumento) {
        if (contrato == null || montoAnterior == null || montoNuevo == null) {
            throw new BusinessException(
                ErrorCodes.DATOS_INCOMPLETOS,
                "Los datos del aumento son incompletos",
                HttpStatus.BAD_REQUEST
            );
        }

        AumentoAlquiler aumento = new AumentoAlquiler();
        aumento.setContrato(contrato);
        aumento.setFechaAumento(clockService.getCurrentDate().toString());
        aumento.setMontoAnterior(montoAnterior);
        aumento.setMontoNuevo(montoNuevo);
        aumento.setPorcentajeAumento(porcentajeAumento != null ? porcentajeAumento : BigDecimal.ZERO);
        aumento.setDescripcion("Aumento automático registrado");
        aumento.setCreatedAt(clockService.getCurrentDateTime().toString());

        AumentoAlquiler aumentoGuardado = aumentoAlquilerRepository.save(aumento);
        return new AumentoAlquilerDTO(aumentoGuardado);
    }

    /**
     * Obtener aumentos en un rango de fechas para un contrato
     */
    public List<AumentoAlquilerDTO> obtenerAumentosPorRangoFechas(Long contratoId, String fechaInicio, String fechaFin) {
        // Validar que el contrato existe
        if (!contratoRepository.existsById(contratoId)) {
            throw new BusinessException(
                ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "No se encontró el contrato con ID: " + contratoId,
                HttpStatus.NOT_FOUND
            );
        }

        List<AumentoAlquiler> aumentos = aumentoAlquilerRepository
                .findByContratoIdAndFechaAumentoBetween(contratoId, fechaInicio, fechaFin);
        return aumentos.stream()
                .map(AumentoAlquilerDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Contar aumentos de un contrato
     */
    public Long contarAumentos(Long contratoId) {
        Optional<Contrato> contratoOpt = contratoRepository.findById(contratoId);
        if (!contratoOpt.isPresent()) {
            throw new BusinessException(
                ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "No se encontró el contrato con ID: " + contratoId,
                HttpStatus.NOT_FOUND
            );
        }
        return aumentoAlquilerRepository.countByContrato(contratoOpt.get());
    }

    /**
     * Obtener el último aumento registrado de un contrato
     */
    public AumentoAlquilerDTO obtenerUltimoAumento(Long contratoId) {
        List<AumentoAlquilerDTO> aumentos = obtenerHistorialAumentos(contratoId);
        if (aumentos.isEmpty()) {
            throw new BusinessException(
                ErrorCodes.RECURSO_NO_ENCONTRADO,
                "No hay aumentos registrados para este contrato",
                HttpStatus.NOT_FOUND
            );
        }
        return aumentos.get(0); // El primero es el más reciente
    }

    /**
     * Crear un objeto AumentoAlquiler sin guardarlo en base de datos
     * Usado para optimización de batch inserts
     */
    public AumentoAlquiler crearAumentoSinGuardar(Contrato contrato, BigDecimal montoAnterior,
                                                   BigDecimal montoNuevo, BigDecimal porcentajeAumento) {
        AumentoAlquiler aumento = new AumentoAlquiler();
        aumento.setContrato(contrato);
        aumento.setFechaAumento(clockService.getCurrentDate().toString());
        aumento.setMontoAnterior(montoAnterior);
        aumento.setMontoNuevo(montoNuevo);
        aumento.setPorcentajeAumento(porcentajeAumento != null ? porcentajeAumento : BigDecimal.ZERO);
        aumento.setDescripcion("Aumento automático registrado");
        aumento.setCreatedAt(clockService.getCurrentDateTime().toString());
        return aumento;
    }

    /**
     * Guardar múltiples aumentos en batch
     * Optimizado para reducir accesos a base de datos
     */
    @Transactional
    public void guardarAumentosEnBatch(List<AumentoAlquiler> aumentos) {
        if (aumentos != null && !aumentos.isEmpty()) {
            aumentoAlquilerRepository.saveAll(aumentos);
        }
    }

    /**
     * Crea y guarda un registro de aumento de alquiler
     * Utilizado para aumentos manuales cuando falla la API del BCRA
     *
     * @param contrato El contrato asociado al aumento
     * @param montoAnterior El monto antes del aumento
     * @param montoNuevo El monto después del aumento
     * @param porcentajeAumento El porcentaje de aumento aplicado
     * @return El registro de aumento guardado
     */
    @Transactional
    public AumentoAlquiler crearYGuardarAumento(Contrato contrato, BigDecimal montoAnterior,
                                                 BigDecimal montoNuevo, BigDecimal porcentajeAumento) {
        AumentoAlquiler aumento = crearAumentoSinGuardar(contrato, montoAnterior, montoNuevo, porcentajeAumento);
        return aumentoAlquilerRepository.save(aumento);
    }

}
