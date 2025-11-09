package com.alquileres.service;

import com.alquileres.exception.BusinessException;
import com.alquileres.exception.ErrorCodes;
import com.alquileres.model.ConfiguracionPagoServicio;
import com.alquileres.model.Contrato;
import com.alquileres.model.ServicioContrato;
import com.alquileres.model.TipoServicio;
import com.alquileres.repository.ContratoRepository;
import com.alquileres.repository.ServicioContratoRepository;
import com.alquileres.repository.TipoServicioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ServicioContratoService {

    private static final Logger logger = LoggerFactory.getLogger(ServicioContratoService.class);
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ISO_LOCAL_DATE;

    private final ServicioContratoRepository servicioContratoRepository;
    private final ContratoRepository contratoRepository;
    private final TipoServicioRepository tipoServicioRepository;
    private final ConfiguracionPagoServicioService configuracionPagoServicioService;
    private final ServicioActualizacionService servicioActualizacionService;

    public ServicioContratoService(
            ServicioContratoRepository servicioContratoRepository,
            ContratoRepository contratoRepository,
            TipoServicioRepository tipoServicioRepository,
            ConfiguracionPagoServicioService configuracionPagoServicioService,
            ServicioActualizacionService servicioActualizacionService) {
        this.servicioContratoRepository = servicioContratoRepository;
        this.contratoRepository = contratoRepository;
        this.tipoServicioRepository = tipoServicioRepository;
        this.configuracionPagoServicioService = configuracionPagoServicioService;
        this.servicioActualizacionService = servicioActualizacionService;
    }

    /**
     * Obtiene todos los servicios de un contrato
     */
    public List<ServicioContrato> getServiciosByContrato(Long contratoId) {
        return servicioContratoRepository.findByContratoId(contratoId);
    }

    /**
     * Obtiene servicios activos de un contrato
     */
    public List<ServicioContrato> getServiciosActivosByContrato(Long contratoId) {
        return servicioContratoRepository.findByContratoIdAndEsActivoTrue(contratoId);
    }

    /**
     * Crea un nuevo servicio para un contrato (versión simple)
     */
    @Transactional
    public ServicioContrato crearServicio(Long contratoId, Integer tipoServicioId,
                                         Boolean esDeInquilino, Boolean esAnual) {
        return crearServicioCompleto(contratoId, tipoServicioId, null, null, null,
                                    esDeInquilino, esAnual, null);
    }

    /**
     * Crea un nuevo servicio para un contrato con todos los parámetros
     * Automáticamente crea la configuración de pago asociada y genera los pagos pendientes hasta la fecha actual
     *
     * @param contratoId ID del contrato
     * @param tipoServicioId ID del tipo de servicio
     * @param nroCuenta Número de cuenta (opcional)
     * @param nroContrato Número de contrato con el proveedor (opcional)
     * @param nroContratoServicio Número de contrato de servicio (opcional)
     * @param esDeInquilino Si el servicio está a nombre del inquilino
     * @param esAnual Si el pago es anual (false = mensual)
     * @param fechaInicio Fecha de inicio del servicio
     * @return El servicio creado
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ServicioContrato crearServicioCompleto(Long contratoId, Integer tipoServicioId,
                                                  String nroCuenta, String nroContrato, String nroContratoServicio,
                                                  Boolean esDeInquilino, Boolean esAnual,
                                                  String fechaInicio) {
        Contrato contrato = contratoRepository.findById(contratoId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCodes.CONTRATO_NO_ENCONTRADO,
                        "Contrato no encontrado con ID: " + contratoId,
                        HttpStatus.NOT_FOUND));

        TipoServicio tipoServicio = tipoServicioRepository.findById(tipoServicioId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCodes.TIPO_SERVICIO_NO_ENCONTRADO,
                        "Tipo de servicio no encontrado con ID: " + tipoServicioId,
                        HttpStatus.NOT_FOUND));

        // Verificar que no exista ya este servicio para el contrato
        servicioContratoRepository.findByContratoIdAndTipoServicioId(contratoId, tipoServicioId)
                .ifPresent(s -> {
                    throw new BusinessException(
                            ErrorCodes.SERVICIO_YA_EXISTE,
                            "Ya existe un servicio de tipo " + tipoServicio.getNombre() +
                            " para este contrato",
                            HttpStatus.CONFLICT);
                });

        // Crear el servicio
        ServicioContrato servicio = new ServicioContrato(contrato, tipoServicio);
        servicio.setNroCuenta(nroCuenta);
        servicio.setNroContrato(nroContrato);
        servicio.setNroContratoServicio(nroContratoServicio);
        servicio.setEsDeInquilino(esDeInquilino != null ? esDeInquilino : false);
        servicio.setEsAnual(esAnual != null ? esAnual : false);
        servicio.setEsActivo(true);

        // Guardar el servicio
        ServicioContrato servicioGuardado = servicioContratoRepository.save(servicio);
        logger.info("Servicio creado - Contrato ID: {}, Tipo: {}, Mensual: {}",
                   contratoId, tipoServicio.getNombre(), !servicio.getEsAnual());

        // Crear la configuración de pago automática
        String fechaInicioFinal = fechaInicio != null ? fechaInicio : LocalDate.now().format(FORMATO_FECHA);
        ConfiguracionPagoServicio configuracion = configuracionPagoServicioService.crearConfiguracion(servicioGuardado, fechaInicioFinal);
        logger.info("Configuración de pago creada para servicio ID: {}", servicioGuardado.getId());

        // Generar automáticamente los pagos pendientes hasta la fecha actual
        try {
            int pagosGenerados = servicioActualizacionService.generarPagosPendientesParaConfiguracion(configuracion.getId());
            logger.info("Pagos pendientes generados automáticamente para servicio ID {}: {} pagos",
                       servicioGuardado.getId(), pagosGenerados);

            // Si no se generó ningún pago (porque el sistema ya procesó el mes actual),
            // forzar la creación del pago del mes actual para este nuevo servicio
            if (pagosGenerados == 0) {
                boolean pagoActualGenerado = servicioActualizacionService.generarPagoMesActualParaNuevoServicio(configuracion.getId());
                if (pagoActualGenerado) {
                    logger.info("Pago del mes actual forzado para el nuevo servicio ID: {}", servicioGuardado.getId());
                }
            }
        } catch (Exception e) {
            logger.error("Error al generar pagos pendientes para servicio ID {}: {}",
                        servicioGuardado.getId(), e.getMessage(), e);
            // No lanzamos la excepción para no afectar la creación del servicio
        }

        return servicioGuardado;
    }

    /**
     * Actualiza los datos administrativos de un servicio
     */
    @Transactional
    public ServicioContrato actualizarServicio(Integer servicioId, String nroCuenta,
                                              String nroContrato, String nroContratoServicio,
                                              Boolean esDeInquilino, Boolean esAnual) {
        ServicioContrato servicio = servicioContratoRepository.findById(servicioId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCodes.SERVICIO_NO_ENCONTRADO,
                        "Servicio no encontrado con ID: " + servicioId,
                        HttpStatus.NOT_FOUND));

        if (nroCuenta != null) servicio.setNroCuenta(nroCuenta);
        if (nroContrato != null) servicio.setNroContrato(nroContrato);
        if (nroContratoServicio != null) servicio.setNroContratoServicio(nroContratoServicio);
        if (esDeInquilino != null) servicio.setEsDeInquilino(esDeInquilino);
        if (esAnual != null) servicio.setEsAnual(esAnual);

        ServicioContrato servicioActualizado = servicioContratoRepository.save(servicio);
        logger.info("Servicio actualizado: ID={}", servicioId);

        return servicioActualizado;
    }

    /**
     * Desactiva un servicio (borrado lógico)
     * También desactiva su configuración de pago
     */
    @Transactional
    public void desactivarServicio(Integer servicioId) {
        ServicioContrato servicio = servicioContratoRepository.findById(servicioId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCodes.SERVICIO_NO_ENCONTRADO,
                        "Servicio no encontrado con ID: " + servicioId,
                        HttpStatus.NOT_FOUND));

        servicio.setEsActivo(false);
        servicioContratoRepository.save(servicio);

        // Desactivar también la configuración de pago
        configuracionPagoServicioService.obtenerPorServicioContrato(servicioId)
                .ifPresent(config -> configuracionPagoServicioService.desactivarConfiguracion(config.getId()));

        logger.info("Servicio desactivado: ID={}", servicioId);
    }

    /**
     * Reactiva un servicio (versión simple)
     */
    @Transactional
    public void reactivarServicio(Integer servicioId) {
        reactivarServicioConFecha(servicioId, LocalDate.now().format(FORMATO_FECHA));
    }

    /**
     * Reactiva un servicio con nueva fecha de inicio
     *
     * @param servicioId ID del servicio
     * @param nuevaFechaInicio Nueva fecha de inicio para reactivar
     */
    @Transactional
    public void reactivarServicioConFecha(Integer servicioId, String nuevaFechaInicio) {
        ServicioContrato servicio = servicioContratoRepository.findById(servicioId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCodes.SERVICIO_NO_ENCONTRADO,
                        "Servicio no encontrado con ID: " + servicioId,
                        HttpStatus.NOT_FOUND));

        servicio.setEsActivo(true);
        servicioContratoRepository.save(servicio);

        // Verificar si existe configuración
        var configOpt = configuracionPagoServicioService.obtenerPorServicioContrato(servicioId);

        if (configOpt.isPresent()) {
            // Reactivar configuración existente
            ConfiguracionPagoServicio config = configOpt.get();
            config.setEsActivo(true);
            config.setFechaInicio(nuevaFechaInicio);
            // La configuración se actualiza a través del service
        } else {
            // Crear nueva configuración
            configuracionPagoServicioService.crearConfiguracion(servicio, nuevaFechaInicio);
        }

        logger.info("Servicio reactivado ID: {}", servicioId);
    }

    /**
     * Actualiza las fechas de generación de pagos
     */
    @Transactional
    public void actualizarFechasPago(Integer servicioId, LocalDate ultimoPagoGenerado,
                                    LocalDate proximoPago) {
        ServicioContrato servicio = servicioContratoRepository.findById(servicioId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCodes.SERVICIO_NO_ENCONTRADO,
                        "Servicio no encontrado con ID: " + servicioId,
                        HttpStatus.NOT_FOUND));

        if (ultimoPagoGenerado != null) {
            servicio.setUltimoPagoGenerado(ultimoPagoGenerado);
        }

        if (proximoPago != null) {
            servicio.setProximoPago(proximoPago);
        }

        servicioContratoRepository.save(servicio);
        logger.debug("Fechas de pago actualizadas para servicio ID={}", servicioId);
    }

    /**
     * Obtiene servicios que necesitan generar pagos
     */
    public List<ServicioContrato> getServiciosConPagosPendientes() {
        return servicioContratoRepository.findServiciosConPagosPendientes(LocalDate.now());
    }

    /**
     * Calcula y actualiza el próximo pago basándose en el último generado
     */
    @Transactional
    public void calcularYActualizarProximoPago(Integer servicioId) {
        ServicioContrato servicio = servicioContratoRepository.findById(servicioId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCodes.SERVICIO_NO_ENCONTRADO,
                        "Servicio no encontrado con ID: " + servicioId,
                        HttpStatus.NOT_FOUND));

        LocalDate ultimoPago = servicio.getUltimoPagoGenerado();
        if (ultimoPago == null) {
            ultimoPago = LocalDate.now();
        }

        LocalDate proximoPago;
        if (Boolean.TRUE.equals(servicio.getEsAnual())) {
            proximoPago = ultimoPago.plusYears(1);
        } else {
            proximoPago = ultimoPago.plusMonths(1);
        }

        servicio.setProximoPago(proximoPago);
        servicioContratoRepository.save(servicio);

        logger.debug("Próximo pago calculado para servicio ID={}: {}", servicioId, proximoPago);
    }

    /**
     * Crea servicios para todos los tipos de servicio disponibles para un contrato
     */
    @Transactional
    public void crearServiciosParaContrato(Long contratoId) {
        List<TipoServicio> tiposServicio = tipoServicioRepository.findAll();

        for (TipoServicio tipo : tiposServicio) {
            // Verificar que no exista ya
            if (servicioContratoRepository.findByContratoIdAndTipoServicioId(
                    contratoId, tipo.getId()).isEmpty()) {
                crearServicio(contratoId, tipo.getId(), false, false);
            }
        }

        logger.info("Servicios creados para contrato ID={}", contratoId);
    }

    /**
     * Desactiva todos los servicios de un contrato
     */
    @Transactional
    public void desactivarServiciosDeContrato(Long contratoId) {
        List<ServicioContrato> servicios = servicioContratoRepository.findByContratoId(contratoId);
        servicios.forEach(servicio -> {
            servicio.setEsActivo(false);
            servicioContratoRepository.save(servicio);
        });
        logger.info("Todos los servicios desactivados para contrato ID={}", contratoId);
    }
}

