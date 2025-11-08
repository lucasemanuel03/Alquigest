package com.alquileres.service;

import com.alquileres.model.ConfiguracionPagoServicio;
import com.alquileres.model.ConfiguracionSistema;
import com.alquileres.model.PagoServicio;
import com.alquileres.model.ServicioXContrato;
import com.alquileres.model.Contrato;
import com.alquileres.model.TipoServicio;
import com.alquileres.repository.ConfiguracionPagoServicioRepository;
import com.alquileres.repository.ConfiguracionSistemaRepository;
import com.alquileres.repository.PagoServicioRepository;
import com.alquileres.repository.ContratoRepository;
import com.alquileres.repository.TipoServicioRepository;
import com.alquileres.repository.ServicioXContratoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Servicio para la actualización automática de configuraciones de pago de servicios
 * Genera automáticamente las facturas mensuales (PagoServicio)
 */
@Service
public class ServicioActualizacionService {

    private static final Logger logger = LoggerFactory.getLogger(ServicioActualizacionService.class);
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter FORMATO_PERIODO = DateTimeFormatter.ofPattern("MM/yyyy");

    /**
     * Clave para almacenar el último mes procesado en la base de datos
     */
    private static final String CLAVE_ULTIMO_MES_PROCESADO = "ULTIMO_MES_PROCESADO_PAGOS_SERVICIOS";

    private final ConfiguracionPagoServicioRepository configuracionPagoServicioRepository;
    private final PagoServicioRepository pagoServicioRepository;
    private final ConfiguracionPagoServicioService configuracionPagoServicioService;
    private final ConfiguracionSistemaRepository configuracionSistemaRepository;
    private final ContratoRepository contratoRepository;
    private final TipoServicioRepository tipoServicioRepository;
    private final ServicioXContratoRepository servicioXContratoRepository;

    public ServicioActualizacionService(
            ConfiguracionPagoServicioRepository configuracionPagoServicioRepository,
            PagoServicioRepository pagoServicioRepository,
            ConfiguracionPagoServicioService configuracionPagoServicioService,
            ConfiguracionSistemaRepository configuracionSistemaRepository,
            ContratoRepository contratoRepository,
            TipoServicioRepository tipoServicioRepository,
            ServicioXContratoRepository servicioXContratoRepository) {
        this.configuracionPagoServicioRepository = configuracionPagoServicioRepository;
        this.pagoServicioRepository = pagoServicioRepository;
        this.configuracionPagoServicioService = configuracionPagoServicioService;
        this.configuracionSistemaRepository = configuracionSistemaRepository;
        this.contratoRepository = contratoRepository;
        this.tipoServicioRepository = tipoServicioRepository;
        this.servicioXContratoRepository = servicioXContratoRepository;
    }

    /**
     * Procesa todas las configuraciones activas que tienen pagos pendientes de generar
     * Se ejecuta al iniciar sesión y diariamente a las 00:01
     * Solo procesa si el mes actual es diferente al último mes procesado (guardado en BD)
     *
     * @return Cantidad de facturas generadas
     */
    @Transactional
    public int procesarPagosPendientes() {
        try {
            logger.info("=== INICIO procesarPagosPendientes ===");

            // Obtener el mes/ano actual
            String mesActual = YearMonth.now().format(DateTimeFormatter.ofPattern("MM/yyyy"));
            logger.info("Mes actual: {}", mesActual);

            // Obtener el último mes procesado desde la base de datos
            String ultimoMesProcesado = obtenerUltimoMesProcesado();
            logger.info("Último mes procesado en BD: {}", ultimoMesProcesado);

            // Verificar si ya se procesó en este mes
            if (mesActual.equals(ultimoMesProcesado)) {
                logger.info("Los pagos ya fueron procesados en el mes actual ({}). No se procesarán nuevamente.", mesActual);
                return 0;
            }

            logger.info("Iniciando procesamiento de facturas de servicios pendientes para el mes {}", mesActual);

            // Obtener la fecha actual en formato ISO
            String fechaActual = LocalDate.now().format(FORMATO_FECHA);
            logger.info("Fecha actual (ISO): {}", fechaActual);

            // DEBUG: Mostrar todas las configuraciones activas
            List<ConfiguracionPagoServicio> todasLasConfiguraciones =
                configuracionPagoServicioRepository.findByEsActivo(true);
            logger.info("Total de configuraciones activas: {}", todasLasConfiguraciones.size());
            for (ConfiguracionPagoServicio config : todasLasConfiguraciones) {
                logger.info("  - Config ID: {}, ServicioXContrato ID: {}, proximoPago: {}, fechaInicio: {}",
                           config.getId(),
                           config.getServicioXContrato().getId(),
                           config.getProximoPago(),
                           config.getFechaInicio());
            }

            // Buscar todas las configuraciones con pagos pendientes
            List<ConfiguracionPagoServicio> configuracionesPendientes =
                configuracionPagoServicioRepository.findConfiguracionesConPagosPendientes(fechaActual);

            logger.info("Configuraciones pendientes encontradas: {}", configuracionesPendientes.size());

            if (configuracionesPendientes.isEmpty()) {
                logger.info("No se encontraron facturas de servicios pendientes para generar");
                // Actualizar el último mes procesado aunque no haya facturas
                actualizarUltimoMesProcesado(mesActual);
                return 0;
            }

            int facturasGeneradas = 0;
            for (ConfiguracionPagoServicio configuracion : configuracionesPendientes) {
                try {
                    logger.info("Procesando configuración ID: {}, proximoPago: {}",
                               configuracion.getId(), configuracion.getProximoPago());

                    // Generar la nueva factura para este período
                    boolean generado = generarFacturaParaPeriodo(configuracion);

                    if (generado) {
                        facturasGeneradas++;
                        logger.info("Factura generada para configuración ID: {}", configuracion.getId());
                    }

                } catch (Exception e) {
                    logger.error("Error al procesar configuración ID {}: {}",
                                configuracion.getId(), e.getMessage(), e);
                    // Continuar con la siguiente configuración
                }
            }

            // Actualizar el último mes procesado en la base de datos
            actualizarUltimoMesProcesado(mesActual);
            logger.info("Se generaron {} nuevas facturas para pagos pendientes. Último mes procesado actualizado a: {}",
                       facturasGeneradas, mesActual);

            logger.info("=== FIN procesarPagosPendientes ===");
            return facturasGeneradas;

        } catch (Exception e) {
            logger.error("Error al procesar facturas de servicios pendientes: {}", e.getMessage(), e);
            // No lanzamos la excepción para que no afecte el login del usuario
            return 0;
        }
    }

    /**
     * Obtiene el último mes procesado desde la base de datos
     *
     * @return El último mes procesado en formato MM/yyyy, o null si nunca se procesó
     */
    private String obtenerUltimoMesProcesado() {
        Optional<ConfiguracionSistema> config = configuracionSistemaRepository.findByClave(CLAVE_ULTIMO_MES_PROCESADO);
        return config.map(ConfiguracionSistema::getValor).orElse(null);
    }

    /**
     * Actualiza el último mes procesado en la base de datos
     * Usa una transacción nueva e independiente para evitar bloqueos con SQLite
     *
     * @param mesActual El mes actual en formato MM/yyyy
     */
    public void actualizarUltimoMesProcesado(String mesActual) {
        try {
            logger.info("Intentando actualizar último mes procesado a: {}", mesActual);
            Optional<ConfiguracionSistema> configOpt = configuracionSistemaRepository.findByClave(CLAVE_ULTIMO_MES_PROCESADO);

            if (configOpt.isPresent()) {
                // Actualizar el valor existente
                ConfiguracionSistema config = configOpt.get();
                config.setValor(mesActual);
                configuracionSistemaRepository.save(config);
                logger.info("Último mes procesado actualizado en BD: {}", mesActual);
            } else {
                // Crear nuevo registro
                ConfiguracionSistema config = new ConfiguracionSistema(
                    CLAVE_ULTIMO_MES_PROCESADO,
                    mesActual,
                    "Último mes en que se procesaron los pagos de servicios automáticamente"
                );
                configuracionSistemaRepository.save(config);
                logger.info("Registro de último mes procesado creado en BD: {}", mesActual);
            }
        } catch (Exception e) {
            logger.error("Error al actualizar último mes procesado: {}", e.getMessage(), e);
            // No lanzamos la excepción para evitar que falle todo el proceso
        }
    }

    /**
     * Genera una nueva factura (PagoServicio) para el período correspondiente
     * y actualiza la configuración con el próximo pago
     *
     * @param configuracion La configuración de pago
     * @return true si se generó la factura, false si ya existía o hubo error
     */
    protected boolean generarFacturaParaPeriodo(ConfiguracionPagoServicio configuracion) {
        try {
            ServicioXContrato servicio = configuracion.getServicioXContrato();

            // Verificar que el servicio esté activo
            if (!Boolean.TRUE.equals(servicio.getEsActivo())) {
                logger.warn("El servicio ID {} no está activo. Desactivando configuración.",
                           servicio.getId());
                configuracionPagoServicioService.desactivarConfiguracion(configuracion.getId());
                return false;
            }

            // Calcular el período en formato mm/aaaa
            String periodo = calcularPeriodo(configuracion.getProximoPago());

            // Verificar si ya existe una factura para este servicio y período
            if (pagoServicioRepository.existsByServicioXContratoIdAndPeriodo(servicio.getId(), periodo)) {
                logger.debug("Ya existe una factura para el período {} del servicio ID: {}",
                            periodo, servicio.getId());

                // Actualizar la configuración aunque ya exista la factura
                configuracionPagoServicioService.actualizarDespuesDeGenerarPago(
                    configuracion, configuracion.getProximoPago());

                return false;
            }

            // Crear la nueva factura (PagoServicio) para este período
            PagoServicio nuevaFactura = new PagoServicio();
            nuevaFactura.setServicioXContrato(servicio);
            nuevaFactura.setPeriodo(periodo);

            // La factura se crea sin pagar
            nuevaFactura.setEstaPagado(false);
            nuevaFactura.setEstaVencido(false);

            // Guardar la nueva factura
            pagoServicioRepository.save(nuevaFactura);
            logger.info("Nueva factura generada - Período: {}, Servicio: {}, Contrato ID: {}",
                       periodo, servicio.getTipoServicio().getNombre(),
                       servicio.getContrato().getId());

            // Actualizar la configuración con la nueva fecha de próximo pago
            configuracionPagoServicioService.actualizarDespuesDeGenerarPago(
                configuracion, configuracion.getProximoPago());

            return true;

        } catch (Exception e) {
            logger.error("Error al generar factura para configuración ID {}: {}",
                        configuracion.getId(), e.getMessage(), e);
            return false;
        }
    }

    /**
     * Calcula el período en formato mm/aaaa a partir de una fecha ISO
     *
     * @param fechaISO Fecha en formato ISO (yyyy-MM-dd)
     * @return Período en formato mm/aaaa
     */
    private String calcularPeriodo(String fechaISO) {
        try {
            LocalDate fecha = LocalDate.parse(fechaISO, FORMATO_FECHA);
            return fecha.format(FORMATO_PERIODO);
        } catch (Exception e) {
            logger.error("Error al calcular período desde fecha: {}", fechaISO, e);
            // En caso de error, retornar formato actual
            return LocalDate.now().format(FORMATO_PERIODO);
        }
    }


    /**
     * Fuerza el procesamiento de pagos independientemente del mes
     * Útil para testing o procesamiento manual
     *
     * @return Cantidad de facturas generadas
     */
    @Transactional
    public int forzarProcesamientoPagos() {
        // Obtener el mes anterior desde la BD
        String mesAnterior = obtenerUltimoMesProcesado();

        // Eliminar la configuración para forzar el procesamiento
        configuracionSistemaRepository.findByClave(CLAVE_ULTIMO_MES_PROCESADO)
            .ifPresent(configuracionSistemaRepository::delete);

        logger.info("Forzando procesamiento de pagos. Último mes procesado era: {}", mesAnterior);

        return procesarPagosPendientes();
    }

    /**
     * Obtiene el último mes procesado desde la base de datos
     *
     * @return El último mes procesado en formato MM/yyyy, o null si nunca se procesó
     */
    public String getUltimoMesProcesado() {
        return obtenerUltimoMesProcesado();
    }

    /**
     * Genera pagos pendientes para una configuración específica recién creada
     * Este método genera todos los pagos desde la fecha de inicio hasta el mes actual
     *
     * @param configuracionId ID de la configuración de pago
     * @return Cantidad de pagos generados
     */
    @Transactional
    public int generarPagosPendientesParaConfiguracion(Integer configuracionId) {
        try {
            logger.info("Generando pagos pendientes para configuración ID: {}", configuracionId);

            Optional<ConfiguracionPagoServicio> configOpt =
                configuracionPagoServicioRepository.findById(configuracionId);

            if (configOpt.isEmpty()) {
                logger.warn("Configuración no encontrada con ID: {}", configuracionId);
                return 0;
            }

            ConfiguracionPagoServicio configuracion = configOpt.get();

            // Verificar que el servicio esté activo
            if (!Boolean.TRUE.equals(configuracion.getServicioXContrato().getEsActivo())) {
                logger.warn("El servicio del configuración ID {} no está activo. No se generarán pagos.", configuracionId);
                return 0;
            }

            String fechaActual = LocalDate.now().format(FORMATO_FECHA);
            int pagosGenerados = 0;

            // Generar pagos mientras el próximo pago sea menor o igual a la fecha actual
            while (configuracion.getProximoPago() != null &&
                   configuracion.getProximoPago().compareTo(fechaActual) <= 0) {

                boolean generado = generarFacturaParaPeriodo(configuracion);

                if (generado) {
                    pagosGenerados++;
                }

                // Recargar la configuración para obtener el próximo pago actualizado
                configuracion = configuracionPagoServicioRepository.findById(configuracionId)
                    .orElse(configuracion);

                // Verificar si hay fechaFin y si ya se pasó
                if (configuracion.getFechaFin() != null &&
                    configuracion.getProximoPago().compareTo(configuracion.getFechaFin()) > 0) {
                    logger.info("Se alcanzó la fecha fin. Desactivando configuración ID: {}", configuracionId);
                    configuracionPagoServicioService.desactivarConfiguracion(configuracionId);
                    break;
                }
            }

            logger.info("Pagos pendientes generados para configuración ID {}: {} pagos",
                       configuracionId, pagosGenerados);
            return pagosGenerados;

        } catch (Exception e) {
            logger.error("Error al generar pagos pendientes para configuración ID {}: {}",
                        configuracionId, e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Genera el pago del mes actual para un servicio recién creado
     * Este método fuerza la creación del pago del mes actual independientemente del estado del sistema
     * Útil para cuando se crea un nuevo contrato después de que el sistema ya procesó el mes
     *
     * @param configuracionId ID de la configuración de pago
     * @return true si se generó el pago, false en caso contrario
     */
    @Transactional
    public boolean generarPagoMesActualParaNuevoServicio(Integer configuracionId) {
        try {
            logger.info("Forzando generación de pago del mes actual para configuración ID: {}", configuracionId);

            Optional<ConfiguracionPagoServicio> configOpt =
                configuracionPagoServicioRepository.findById(configuracionId);

            if (configOpt.isEmpty()) {
                logger.warn("Configuración no encontrada con ID: {}", configuracionId);
                return false;
            }

            ConfiguracionPagoServicio configuracion = configOpt.get();
            ServicioXContrato servicio = configuracion.getServicioXContrato();

            // Verificar que el servicio esté activo
            if (!Boolean.TRUE.equals(servicio.getEsActivo())) {
                logger.warn("El servicio ID {} no está activo.", servicio.getId());
                return false;
            }

            // Obtener el mes actual
            LocalDate fechaActual = LocalDate.now();
            String periodoActual = fechaActual.format(FORMATO_PERIODO);

            // Verificar si ya existe una factura para este servicio y período actual
            if (pagoServicioRepository.existsByServicioXContratoIdAndPeriodo(servicio.getId(), periodoActual)) {
                logger.debug("Ya existe una factura para el período {} del servicio ID: {}",
                            periodoActual, servicio.getId());
                return false;
            }

            // Crear la nueva factura (PagoServicio) para el mes actual
            PagoServicio nuevaFactura = new PagoServicio();
            nuevaFactura.setServicioXContrato(servicio);
            nuevaFactura.setPeriodo(periodoActual);
            nuevaFactura.setEstaPagado(false);
            nuevaFactura.setEstaVencido(false);

            // Guardar la nueva factura
            pagoServicioRepository.save(nuevaFactura);
            logger.info("Pago del mes actual generado forzadamente - Período: {}, Servicio: {}, Contrato ID: {}",
                       periodoActual, servicio.getTipoServicio().getNombre(),
                       servicio.getContrato().getId());

            return true;

        } catch (Exception e) {
            logger.error("Error al generar pago del mes actual para configuración ID {}: {}",
                        configuracionId, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Crea automáticamente servicios y sus configuraciones para todos los contratos vigentes
     * que no tengan servicios configurados.
     * Se ejecuta al iniciar sesión para asegurar que todos los contratos tengan sus servicios.
     * OPTIMIZADO: Usa batch processing y reduce queries a BD
     *
     * @return Cantidad de servicios creados
     */
    @Transactional
    public int crearServiciosParaContratosVigentes() {
        try {
            logger.info("Iniciando creacion automatica de servicios para contratos vigentes");

            // Obtener todos los contratos vigentes
            List<Contrato> contratosVigentes = contratoRepository.findContratosVigentes();

            if (contratosVigentes.isEmpty()) {
                logger.info("No se encontraron contratos vigentes");
                return 0;
            }

            logger.info("Se encontraron {} contratos vigentes", contratosVigentes.size());

            // Obtener todos los tipos de servicio disponibles
            List<TipoServicio> tiposServicio = tipoServicioRepository.findAll();

            if (tiposServicio.isEmpty()) {
                logger.warn("No hay tipos de servicio configurados en el sistema");
                return 0;
            }

            // OPTIMIZACIÓN: Obtener TODOS los servicios existentes de una sola vez
            List<ServicioXContrato> todosLosServicios = servicioXContratoRepository.findAll();

            int serviciosCreados = 0;
            String fechaActual = LocalDate.now().format(FORMATO_FECHA);

            // Listas para batch processing
            List<ServicioXContrato> serviciosACrear = new java.util.ArrayList<>();
            List<ConfiguracionPagoServicio> configuracionesACrear = new java.util.ArrayList<>();

            // Para cada contrato vigente
            for (Contrato contrato : contratosVigentes) {
                // OPTIMIZACIÓN: Filtrar en memoria en lugar de BD
                // Solo considerar servicios activos (esActivo=true)
                boolean tieneServicios = todosLosServicios.stream()
                    .anyMatch(s -> s.getContrato().getId().equals(contrato.getId())
                        && Boolean.TRUE.equals(s.getEsActivo()));

                // Si el contrato no tiene servicios, crear uno para cada tipo
                if (!tieneServicios) {
                    for (TipoServicio tipoServicio : tiposServicio) {
                        // Crear el ServicioXContrato
                        ServicioXContrato nuevoServicio = new ServicioXContrato();
                        nuevoServicio.setContrato(contrato);
                        nuevoServicio.setTipoServicio(tipoServicio);
                        nuevoServicio.setEsDeInquilino(false);
                        nuevoServicio.setEsAnual(false);
                        nuevoServicio.setEsActivo(true);

                        serviciosACrear.add(nuevoServicio);
                        serviciosCreados++;
                    }
                }
            }

            // OPTIMIZACIÓN: Guardar todos los servicios de una sola vez (batch)
            if (!serviciosACrear.isEmpty()) {
                List<ServicioXContrato> serviciosGuardados = servicioXContratoRepository.saveAll(serviciosACrear);
                logger.info("Se guardaron {} servicios en batch", serviciosGuardados.size());

                // Crear configuraciones para los servicios guardados
                for (ServicioXContrato servicio : serviciosGuardados) {
                    try {
                        ConfiguracionPagoServicio configuracion =
                            configuracionPagoServicioService.crearConfiguracion(servicio, fechaActual);
                        configuracionesACrear.add(configuracion);
                    } catch (Exception e) {
                        logger.error("Error al crear configuración para servicio ID {}: {}",
                                   servicio.getId(), e.getMessage());
                    }
                }

                // Guardar todas las configuraciones de una sola vez (batch)
                if (!configuracionesACrear.isEmpty()) {
                    configuracionPagoServicioRepository.saveAll(configuracionesACrear);
                    logger.info("Se guardaron {} configuraciones de pago en batch", configuracionesACrear.size());
                }
            }

            logger.info("Creacion automatica completada. Total de servicios creados: {}", serviciosCreados);
            return serviciosCreados;

        } catch (Exception e) {
            logger.error("Error al crear servicios para contratos vigentes: {}", e.getMessage(), e);
            return 0;
        }
    }
}
