package com.alquileres.service;

import com.alquileres.model.ConfiguracionSistema;
import com.alquileres.model.PagoServicio;
import com.alquileres.model.ServicioContrato;
import com.alquileres.model.Contrato;
import com.alquileres.model.TipoServicio;
import com.alquileres.repository.ConfiguracionSistemaRepository;
import com.alquileres.repository.PagoServicioRepository;
import com.alquileres.repository.ContratoRepository;
import com.alquileres.repository.TipoServicioRepository;
import com.alquileres.repository.ServicioContratoRepository;
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
 * Servicio para la actualización automática de pagos de servicios
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

    private final PagoServicioRepository pagoServicioRepository;
    private final ConfiguracionSistemaRepository configuracionSistemaRepository;
    private final ContratoRepository contratoRepository;
    private final TipoServicioRepository tipoServicioRepository;
    private final ServicioContratoRepository servicioContratoRepository;
    private final ClockService clockService;

    public ServicioActualizacionService(
            PagoServicioRepository pagoServicioRepository,
            ConfiguracionSistemaRepository configuracionSistemaRepository,
            ContratoRepository contratoRepository,
            TipoServicioRepository tipoServicioRepository,
            ServicioContratoRepository servicioContratoRepository,
            ClockService clockService) {
        this.pagoServicioRepository = pagoServicioRepository;
        this.configuracionSistemaRepository = configuracionSistemaRepository;
        this.contratoRepository = contratoRepository;
        this.tipoServicioRepository = tipoServicioRepository;
        this.servicioContratoRepository = servicioContratoRepository;
        this.clockService = clockService;
    }


    /**
     * Procesa todos los servicios activos que tienen pagos pendientes de generar
     * Se ejecuta al iniciar sesión
     * Solo procesa si el mes actual es diferente al último mes procesado (guardado en BD)
     *
     * @return Cantidad de facturas generadas
     */
    @Transactional
    public int procesarPagosPendientes() {
        try {
            logger.info("=== INICIO procesarPagosPendientes ===");

            // Obtener el mes/año actual desde clockService
            String mesActual = YearMonth.from(clockService.getCurrentDate()).format(DateTimeFormatter.ofPattern("MM/yyyy"));
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

            // Obtener la fecha actual
            LocalDate fechaActual = clockService.getCurrentDate();
            logger.info("Fecha actual: {}", fechaActual);

            // Buscar todos los servicios activos con pagos pendientes
            List<ServicioContrato> serviciosPendientes =
                servicioContratoRepository.findServiciosConPagosPendientes(fechaActual);

            logger.info("Servicios pendientes encontrados: {}", serviciosPendientes.size());

            if (serviciosPendientes.isEmpty()) {
                logger.info("No se encontraron servicios con pagos pendientes para generar");
                // Actualizar el último mes procesado aunque no haya facturas
                actualizarUltimoMesProcesado(mesActual);
                return 0;
            }

            int facturasGeneradas = 0;
            for (ServicioContrato servicio : serviciosPendientes) {
                try {
                    logger.info("Procesando servicio ID: {}, proximoPago: {}",
                               servicio.getId(), servicio.getProximoPago());

                    // Generar la nueva factura para este período
                    boolean generado = generarFacturaParaServicio(servicio);

                    if (generado) {
                        facturasGeneradas++;
                        logger.info("Factura generada para servicio ID: {}", servicio.getId());
                    }

                } catch (Exception e) {
                    logger.error("Error al procesar servicio ID {}: {}",
                                servicio.getId(), e.getMessage(), e);
                    // Continuar con el siguiente servicio
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
        }
    }

    /**
     * Genera una factura (PagoServicio) para el servicio en el período especificado
     *
     * @param servicio El servicio de contrato
     * @return true si se generó la factura, false si ya existía o hubo error
     */
    protected boolean generarFacturaParaServicio(ServicioContrato servicio) {
        try {
            // Verificar que el servicio esté activo
            if (!Boolean.TRUE.equals(servicio.getEsActivo())) {
                logger.warn("El servicio ID {} no está activo.", servicio.getId());
                return false;
            }

            // Calcular el período en formato mm/aaaa
            String periodo = servicio.getProximoPago().format(FORMATO_PERIODO);

            // Verificar si ya existe una factura para este servicio y período
            if (pagoServicioRepository.existsByServicioContratoIdAndPeriodo(servicio.getId(), periodo)) {
                logger.debug("Ya existe una factura para el período {} del servicio ID: {}",
                            periodo, servicio.getId());

                // Actualizar el servicio aunque ya exista la factura
                actualizarFechasServicio(servicio);
                return false;
            }

            // Crear la nueva factura (PagoServicio) para este período
            PagoServicio nuevaFactura = new PagoServicio();
            nuevaFactura.setServicioContrato(servicio);
            nuevaFactura.setPeriodo(periodo);

            // La factura se crea sin pagar
            nuevaFactura.setEstaPagado(false);
            nuevaFactura.setEstaVencido(false);

            // Guardar la nueva factura
            pagoServicioRepository.save(nuevaFactura);
            logger.info("Nueva factura generada - Período: {}, Servicio: {}, Contrato ID: {}",
                       periodo, servicio.getTipoServicio().getNombre(),
                       servicio.getContrato().getId());

            // Actualizar las fechas del servicio
            actualizarFechasServicio(servicio);

            return true;

        } catch (Exception e) {
            logger.error("Error al generar factura para servicio ID {}: {}",
                        servicio.getId(), e.getMessage(), e);
            return false;
        }
    }

    /**
     * Actualiza las fechas de último y próximo pago de un servicio
     */
    private void actualizarFechasServicio(ServicioContrato servicio) {
        LocalDate proximoPago = servicio.getProximoPago();
        servicio.setUltimoPagoGenerado(proximoPago);

        // Calcular el próximo pago según si es anual o mensual
        LocalDate nuevoProximoPago = servicio.getEsAnual()
            ? proximoPago.plusYears(1)
            : proximoPago.plusMonths(1);

        servicio.setProximoPago(nuevoProximoPago);
        servicioContratoRepository.save(servicio);

        logger.debug("Fechas actualizadas para servicio ID={}: último={}, próximo={}",
                    servicio.getId(), proximoPago, nuevoProximoPago);
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
     * Genera pagos pendientes para un servicio específico
     *
     * @param servicioId ID del servicio
     * @return Cantidad de pagos generados
     */
    @Transactional
    public int generarPagosPendientesParaServicio(Integer servicioId) {
        try {
            logger.info("Generando pagos pendientes para servicio ID: {}", servicioId);

            Optional<ServicioContrato> servicioOpt = servicioContratoRepository.findById(servicioId);

            if (servicioOpt.isEmpty()) {
                logger.warn("Servicio no encontrado con ID: {}", servicioId);
                return 0;
            }

            ServicioContrato servicio = servicioOpt.get();

            // Verificar que el servicio esté activo
            if (!Boolean.TRUE.equals(servicio.getEsActivo())) {
                logger.warn("El servicio ID {} no está activo. No se generarán pagos.", servicioId);
                return 0;
            }

            LocalDate fechaActual = clockService.getCurrentDate();
            int pagosGenerados = 0;

            // Generar pagos mientras el próximo pago sea menor o igual a la fecha actual
            while (servicio.getProximoPago() != null &&
                   !servicio.getProximoPago().isAfter(fechaActual)) {

                boolean generado = generarFacturaParaServicio(servicio);

                if (generado) {
                    pagosGenerados++;
                }

                // Recargar el servicio para obtener el próximo pago actualizado
                servicio = servicioContratoRepository.findById(servicioId).orElse(servicio);
            }

            logger.info("Pagos pendientes generados para servicio ID {}: {} pagos",
                       servicioId, pagosGenerados);
            return pagosGenerados;

        } catch (Exception e) {
            logger.error("Error al generar pagos pendientes para servicio ID {}: {}",
                        servicioId, e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Genera el pago del mes actual para un servicio recién creado
     * Este método fuerza la creación del pago del mes actual independientemente del estado del sistema
     * Útil para cuando se crea un nuevo contrato después de que el sistema ya procesó el mes
     *
     * @param servicioId ID del servicio
     * @return true si se generó el pago, false en caso contrario
     */
    @Transactional
    public boolean generarPagoMesActualParaNuevoServicio(Integer servicioId) {
        try {
            logger.info("Forzando generación de pago del mes actual para servicio ID: {}", servicioId);

            Optional<ServicioContrato> servicioOpt = servicioContratoRepository.findById(servicioId);

            if (servicioOpt.isEmpty()) {
                logger.warn("Servicio no encontrado con ID: {}", servicioId);
                return false;
            }

            ServicioContrato servicio = servicioOpt.get();

            // Verificar que el servicio esté activo
            if (!Boolean.TRUE.equals(servicio.getEsActivo())) {
                logger.warn("El servicio ID {} no está activo.", servicio.getId());
                return false;
            }

            // Obtener el mes actual
            LocalDate fechaActual = clockService.getCurrentDate();
            String periodoActual = fechaActual.format(FORMATO_PERIODO);

            // Verificar si ya existe una factura para este servicio y período actual
            if (pagoServicioRepository.existsByServicioContratoIdAndPeriodo(servicio.getId(), periodoActual)) {
                logger.debug("Ya existe una factura para el período {} del servicio ID: {}",
                            periodoActual, servicio.getId());
                return false;
            }

            // Crear la nueva factura (PagoServicio) para el mes actual
            PagoServicio nuevaFactura = new PagoServicio();
            nuevaFactura.setServicioContrato(servicio);
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
            logger.error("Error al generar pago del mes actual para servicio ID {}: {}",
                        servicioId, e.getMessage(), e);
            return false;
        }
    }
}
