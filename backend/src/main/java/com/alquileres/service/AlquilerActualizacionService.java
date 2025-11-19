package com.alquileres.service;

import com.alquileres.model.Alquiler;
import com.alquileres.model.Contrato;
import com.alquileres.model.ConfiguracionSistema;
import com.alquileres.repository.AlquilerRepository;
import com.alquileres.repository.ContratoRepository;
import com.alquileres.repository.ConfiguracionSistemaRepository;
import com.alquileres.util.BCRAApiClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio para la actualización automática de alquileres
 * Genera automáticamente los alquileres mensuales para contratos vigentes
 */
@Service
public class AlquilerActualizacionService {

    private static final Logger logger = LoggerFactory.getLogger(AlquilerActualizacionService.class);
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter FORMATO_PERIODO = DateTimeFormatter.ofPattern("MM/yyyy");

    /**
     * Clave para almacenar el último mes procesado en la base de datos
     */
    private static final String CLAVE_ULTIMO_MES_PROCESADO = "ULTIMO_MES_PROCESADO_ALQUILERES";

    private final AlquilerRepository alquilerRepository;
    private final ContratoRepository contratoRepository;
    private final ConfiguracionSistemaRepository configuracionSistemaRepository;
    private final BCRAApiClient bcraApiClient;
    private final AumentoAlquilerService aumentoAlquilerService;

    @Autowired
    ClockService clockService;

    public AlquilerActualizacionService(
            AlquilerRepository alquilerRepository,
            ContratoRepository contratoRepository,
            ConfiguracionSistemaRepository configuracionSistemaRepository,
            BCRAApiClient bcraApiClient,
            AumentoAlquilerService aumentoAlquilerService) {
        this.alquilerRepository = alquilerRepository;
        this.contratoRepository = contratoRepository;
        this.configuracionSistemaRepository = configuracionSistemaRepository;
        this.bcraApiClient = bcraApiClient;
        this.aumentoAlquilerService = aumentoAlquilerService;
    }

    /**
     * Procesa la creación de alquileres pendientes
     * Solo procesa si el mes actual es diferente al último mes procesado
     *
     * @return Cantidad de alquileres creados
     */
    @Transactional
    public int procesarAlquileresPendientes() {
        try {
            String mesActual = clockService.getCurrentDate().format(FORMATO_PERIODO);
            String ultimoMesProcesado = obtenerUltimoMesProcesado();

            logger.info("Verificando procesamiento de alquileres. Mes actual: {}, Último procesado: {}",
                       mesActual, ultimoMesProcesado);

            // Si ya procesamos este mes, no hacer nada
            if (mesActual.equals(ultimoMesProcesado)) {
                logger.info("Los alquileres del mes {} ya fueron procesados. No se requiere acción.", mesActual);
                return 0;
            }

            logger.info("Iniciando procesamiento de alquileres para el mes {}", mesActual);

            // Crear alquileres para todos los contratos vigentes
            int alquileresCreados = crearAlquileresParaContratosVigentes();

            // Actualizar el último mes procesado
            actualizarUltimoMesProcesado(mesActual);

            logger.info("Procesamiento de alquileres completado. Total creados: {}", alquileresCreados);
            return alquileresCreados;

        } catch (Exception e) {
            logger.error("Error en procesamiento de alquileres: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Obtiene el último mes procesado desde la base de datos
     *
     * @return El último mes procesado en formato MM/yyyy, o null si nunca se procesó
     */
    private String obtenerUltimoMesProcesado() {
        try {
            Optional<ConfiguracionSistema> config =
                configuracionSistemaRepository.findByClave(CLAVE_ULTIMO_MES_PROCESADO);

            if (config.isPresent()) {
                String valor = config.get().getValor();
                logger.debug("Ultimo mes procesado obtenido de BD: {}", valor);
                return valor;
            } else {
                logger.debug("No se encontro registro de ultimo mes procesado en BD");
                return null;
            }
        } catch (Exception e) {
            logger.error("Error al obtener ultimo mes procesado: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Actualiza el último mes procesado en la base de datos
     *
     * @param mesActual Mes actual en formato MM/yyyy
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected void actualizarUltimoMesProcesado(String mesActual) {
        try {
            Optional<ConfiguracionSistema> configOpt =
                configuracionSistemaRepository.findByClave(CLAVE_ULTIMO_MES_PROCESADO);

            if (configOpt.isPresent()) {
                // Actualizar valor existente
                ConfiguracionSistema config = configOpt.get();
                config.setValor(mesActual);
                configuracionSistemaRepository.save(config);
                logger.info("Último mes procesado actualizado en BD: {}", mesActual);
            } else {
                // Crear nuevo registro
                ConfiguracionSistema config = new ConfiguracionSistema(
                    CLAVE_ULTIMO_MES_PROCESADO,
                    mesActual,
                    "Último mes en que se procesaron los alquileres automáticamente"
                );
                configuracionSistemaRepository.save(config);
                logger.info("Registro de ultimo mes procesado creado en BD: {}", mesActual);
            }
        } catch (Exception e) {
            logger.error("Error al actualizar ultimo mes procesado: {}", e.getMessage(), e);
            // No lanzamos la excepción para evitar que falle todo el proceso
        }
    }

    /**
     * Crea alquileres para todos los contratos vigentes que no tengan alquileres pendientes
     * Optimizado para procesar en batch y reducir transacciones
     *
     * @return Cantidad de alquileres creados
     */
    @Transactional
    public int crearAlquileresParaContratosVigentes() {
        try {
            logger.info("Iniciando creacion automatica de alquileres para contratos vigentes");

            // Obtener todos los contratos vigentes
            List<Contrato> contratosVigentes = contratoRepository.findContratosVigentes();

            logger.info("Encontrados {} contratos vigentes para verificar alquileres", contratosVigentes.size());

            if (contratosVigentes.isEmpty()) {
                logger.info("No hay contratos vigentes para procesar");
                return 0;
            }

            // Obtener IDs de contratos que ya tienen alquileres pendientes
            List<Long> contratoIds = contratosVigentes.stream()
                .map(Contrato::getId)
                .collect(Collectors.toList());

            // Buscar alquileres pendientes en batch
            LocalDate fechaActual = clockService.getCurrentDate();
            int mesActual = fechaActual.getMonthValue();
            int anioActual = fechaActual.getYear();
            List<Alquiler> alquileresPendientes = alquilerRepository.findAlquileresPendientesByContratoIdsAndMesAnioActual(contratoIds, mesActual, anioActual);

            // Crear un Set de IDs de contratos que ya tienen alquileres
            java.util.Set<Long> contratosConAlquileres = alquileresPendientes.stream()
                .map(a -> a.getContrato().getId())
                .collect(Collectors.toSet());

            // Filtrar contratos que necesitan alquileres
            List<Contrato> contratosSinAlquileres = contratosVigentes.stream()
                .filter(c -> !contratosConAlquileres.contains(c.getId()))
                .toList();

            if (contratosSinAlquileres.isEmpty()) {
                logger.info("Todos los contratos vigentes ya tienen alquileres pendientes");
                return 0;
            }

            logger.info("Procesando {} contratos que necesitan alquileres", contratosSinAlquileres.size());

            // Calcular fecha de vencimiento una sola vez
            LocalDate fechaVencimiento = LocalDate.of(fechaActual.getYear(), fechaActual.getMonth(), 10);
            String fechaVencimientoISO = fechaVencimiento.format(FORMATO_FECHA);

            // Colección para batch insert
            List<Alquiler> nuevosAlquileres = new java.util.ArrayList<>();
            List<com.alquileres.model.AumentoAlquiler> nuevosAumentos = new java.util.ArrayList<>();

            // Procesar cada contrato
            for (Contrato contrato : contratosSinAlquileres) {
                try {
                    BigDecimal montoOriginal = contrato.getMonto();
                    BigDecimal montoNuevo = montoOriginal;
                    boolean aplicoAumento = false;

                    // Obtener el último alquiler para determinar el monto
                    Optional<Alquiler> ultimoAlquilerOpt =
                        alquilerRepository.findTopByContratoOrderByFechaVencimientoPagoDesc(contrato);

                    // Verificar si debe aplicar aumento
                    if (debeAplicarAumento(contrato)) {
                        BigDecimal montoBase = ultimoAlquilerOpt.isPresent()
                            ? ultimoAlquilerOpt.get().getMonto()
                            : montoOriginal;

                        // Calcular nuevo monto según tipo de aumento
                        if (Boolean.TRUE.equals(contrato.getAumentaConIcl())) {
                            try {
                                String fechaInicio = contrato.getFechaAumento();
                                String fechaFin = clockService.getCurrentDate().withDayOfMonth(1).format(FORMATO_FECHA);

                                BigDecimal tasaAumento = bcraApiClient.obtenerTasaAumentoICL(fechaInicio, fechaFin);
                                montoNuevo = montoBase.multiply(tasaAumento).setScale(2, BigDecimal.ROUND_HALF_UP);
                                aplicoAumento = true;

                                // Preparar registro de aumento
                                BigDecimal porcentajeAumento = tasaAumento.subtract(BigDecimal.ONE)
                                    .multiply(new BigDecimal("100"))
                                    .setScale(2, BigDecimal.ROUND_HALF_UP);

                                com.alquileres.model.AumentoAlquiler aumento =
                                aumentoAlquilerService.crearAumentoSinGuardar(
                                    contrato, montoBase, montoNuevo, porcentajeAumento);
                                nuevosAumentos.add(aumento);

                                // ✅ ACTUALIZAR fechaAumento: sumar periodoAumento a la fechaAumento actual
                                actualizarFechaAumentoContrato(contrato);

                            } catch (Exception e) {
                                logger.error("Error al consultar ICL para contrato ID {}: {}. Se marcara para aumento manual.",
                                           contrato.getId(), e.getMessage());
                                // ❌ Fallo la API - crear alquiler con monto base y marcar para aumento manual
                                montoNuevo = montoBase;

                                // Crear el alquiler pero marcado para aumento manual
                                Alquiler alquilerConError = new Alquiler(contrato, fechaVencimientoISO, montoNuevo);
                                alquilerConError.setNecesitaAumentoManual(true);
                                nuevosAlquileres.add(alquilerConError);

                                logger.warn("Alquiler para contrato ID {} creado con necesitaAumentoManual=true", contrato.getId());
                                continue; // Saltar al siguiente contrato
                            }
                        } else {
                            // Aumento fijo
                            BigDecimal porcentajeAumento = contrato.getPorcentajeAumento() != null
                                ? contrato.getPorcentajeAumento()
                                : BigDecimal.ZERO;

                            BigDecimal tasaAumento = BigDecimal.ONE.add(
                                porcentajeAumento.divide(new BigDecimal("100"), 10, BigDecimal.ROUND_HALF_UP)
                            );

                            montoNuevo = montoBase.multiply(tasaAumento).setScale(2, BigDecimal.ROUND_HALF_UP);
                            aplicoAumento = true;

                            // Preparar registro de aumento
                            com.alquileres.model.AumentoAlquiler aumento =
                                aumentoAlquilerService.crearAumentoSinGuardar(
                                    contrato, montoBase, montoNuevo, porcentajeAumento);
                            nuevosAumentos.add(aumento);

                            // ✅ ACTUALIZAR fechaAumento: sumar periodoAumento a la fechaAumento actual
                            actualizarFechaAumentoContrato(contrato);
                        }
                    } else {
                        montoNuevo = ultimoAlquilerOpt.isPresent()
                            ? ultimoAlquilerOpt.get().getMonto()
                            : montoOriginal;
                    }

                    // Crear alquiler
                    Alquiler nuevoAlquiler = new Alquiler(contrato, fechaVencimientoISO, montoNuevo);
                    nuevoAlquiler.setEsActivo(true);
                    nuevosAlquileres.add(nuevoAlquiler);

                    logger.debug("Alquiler preparado para contrato ID: {} - Monto: {} (Aumento: {})",
                               contrato.getId(), montoNuevo, aplicoAumento);

                } catch (Exception e) {
                    logger.error("Error al preparar alquiler para contrato ID {}: {}",
                                contrato.getId(), e.getMessage());
                }
            }

            // Guardar todos los alquileres en batch
            if (!nuevosAlquileres.isEmpty()) {
                alquilerRepository.saveAll(nuevosAlquileres);
                logger.info("Guardados {} alquileres en batch", nuevosAlquileres.size());
            }

            // Guardar todos los aumentos en batch
            if (!nuevosAumentos.isEmpty()) {
                aumentoAlquilerService.guardarAumentosEnBatch(nuevosAumentos);
                logger.info("Guardados {} aumentos en batch", nuevosAumentos.size());
            }

            logger.info("Creación automatica de alquileres completada. Total: {}", nuevosAlquileres.size());
            return nuevosAlquileres.size();

        } catch (Exception e) {
            logger.error("Error en creación automatica de alquileres: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Crea un alquiler para un contrato específico si no tiene alquileres pendientes
     * Aplica aumento por ICL si corresponde
     * Usa una transacción independiente para evitar bloqueos
     *
     * @param contrato El contrato para el cual crear el alquiler
     * @return true si se creó el alquiler, false en caso contrario
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected boolean crearAlquilerParaContrato(Contrato contrato) {
        try {
            // Verificar si el contrato ya tiene alquileres pendientes
            List<Alquiler> alquileresPendientes =
                alquilerRepository.findAlquileresPendientesByContratoId(contrato.getId());

            if (!alquileresPendientes.isEmpty()) {
                logger.debug("Contrato ID {} ya tiene alquileres pendientes, se omite creacion",
                           contrato.getId());
                return false;
            }

            // Obtener el último alquiler para determinar el monto
            Optional<Alquiler> ultimoAlquilerOpt =
                alquilerRepository.findTopByContratoOrderByFechaVencimientoPagoDesc(contrato);

            BigDecimal montoOriginal = contrato.getMonto();
            BigDecimal montoNuevo = montoOriginal;
            boolean aplicoAumento = false;

            // Verificar si debe aplicar aumento
            if (debeAplicarAumento(contrato)) {
                logger.info("Contrato ID {} requiere aumento. Aumenta con ICL: {}",
                           contrato.getId(), contrato.getAumentaConIcl());

                BigDecimal montoBase = ultimoAlquilerOpt.isPresent()
                    ? ultimoAlquilerOpt.get().getMonto()
                    : montoOriginal;

                // Si aumenta con ICL, consultar la API del BCRA
                if (contrato.getAumentaConIcl() != null && contrato.getAumentaConIcl()) {
                    try {
                        // Obtener fechas para consultar ICL
                        String fechaInicio = contrato.getFechaAumento();
                        String fechaFin = clockService.getCurrentDate().withDayOfMonth(1).format(FORMATO_FECHA);

                        logger.info("Consultando ICL del BCRA para contrato ID {} - Desde: {} hasta: {}",
                                   contrato.getId(), fechaInicio, fechaFin);

                        // Consultar tasa de aumento del BCRA
                        BigDecimal tasaAumento = bcraApiClient.obtenerTasaAumentoICL(fechaInicio, fechaFin);
                        montoNuevo = montoBase.multiply(tasaAumento).setScale(2, BigDecimal.ROUND_HALF_UP);
                        aplicoAumento = true;

                        logger.info("ICL aplicado al contrato ID {} - Monto anterior: {}, Monto nuevo: {}, Tasa: {}",
                                   contrato.getId(), montoBase, montoNuevo, tasaAumento);

                        // Registrar el aumento en el historial
                        BigDecimal porcentajeAumento = tasaAumento.subtract(BigDecimal.ONE)
                            .multiply(new BigDecimal("100"))
                            .setScale(2, BigDecimal.ROUND_HALF_UP);

                        aumentoAlquilerService.registrarAumentoAutomatico(
                            contrato,
                            montoBase,
                            montoNuevo,
                            porcentajeAumento
                        );

                        // ✅ ACTUALIZAR fechaAumento: sumar periodoAumento a la fechaAumento actual
                        actualizarFechaAumentoContrato(contrato);

                    } catch (Exception e) {
                        logger.error("Error al consultar ICL para contrato ID {}: {}. Se usara el monto sin aumento.",
                                   contrato.getId(), e.getMessage());
                        // Si falla la consulta, usar el monto original
                        montoNuevo = montoBase;
                    }
                } else {
                    // Aumenta sin ICL - Aplicar porcentaje fijo: monto × (1 + (porcentajeAumento / 100)) ✅
                    BigDecimal porcentajeAumento = contrato.getPorcentajeAumento() != null
                        ? contrato.getPorcentajeAumento()
                        : BigDecimal.ZERO;

                    // Calcular: 1 + (porcentajeAumento / 100)
                    BigDecimal tasaAumento = BigDecimal.ONE.add(
                        porcentajeAumento.divide(new BigDecimal("100"), 10, BigDecimal.ROUND_HALF_UP)
                    );

                    montoNuevo = montoBase.multiply(tasaAumento).setScale(2, BigDecimal.ROUND_HALF_UP);
                    aplicoAumento = true;

                    logger.info("Aumento fijo aplicado al contrato ID {} - Monto anterior: {}, Monto nuevo: {}, Porcentaje: {}%",
                               contrato.getId(), montoBase, montoNuevo, porcentajeAumento);

                    // Registrar el aumento en el historial
                    aumentoAlquilerService.registrarAumentoAutomatico(
                        contrato,
                        montoBase,
                        montoNuevo,
                        porcentajeAumento
                    );

                    // ✅ ACTUALIZAR fechaAumento: sumar periodoAumento a la fechaAumento actual
                    actualizarFechaAumentoContrato(contrato);
                }
            } else {
                // No aplica aumento, usar el monto del último alquiler o del contrato
                montoNuevo = ultimoAlquilerOpt.isPresent()
                    ? ultimoAlquilerOpt.get().getMonto()
                    : montoOriginal;
            }

            // Crear nuevo alquiler con vencimiento el día 10 del mes actual
            LocalDate fechaActual = clockService.getCurrentDate();
            LocalDate fechaVencimiento = LocalDate.of(fechaActual.getYear(), fechaActual.getMonth(), 10);
            String fechaVencimientoISO = fechaVencimiento.format(FORMATO_FECHA);

            Alquiler nuevoAlquiler = new Alquiler(contrato, fechaVencimientoISO, montoNuevo);
            nuevoAlquiler.setEsActivo(true);
            alquilerRepository.save(nuevoAlquiler);

            logger.info("Alquiler creado automaticamente para contrato ID: {} - Monto: {} (Aumento aplicado: {})",
                       contrato.getId(), montoNuevo, aplicoAumento);
            return true;

        } catch (Exception e) {
            logger.error("Error al crear alquiler para contrato ID {}: {}",
                        contrato.getId(), e.getMessage(), e);
            return false;
        }
    }

    /**
     * Actualiza la fechaAumento de un contrato sumando el periodoAumento
     * Si la nueva fechaAumento supera la fechaFin del contrato, se establece como "No aumenta más"
     * ✅ ESTE MÉTODO SE EJECUTA DESPUÉS DE APLICAR UN AUMENTO
     *
     * @param contrato El contrato cuya fechaAumento se debe actualizar
     */
    public void actualizarFechaAumentoContrato(Contrato contrato) {
        try {
            // Validar que tenga periodoAumento configurado
            if (contrato.getPeriodoAumento() == null || contrato.getPeriodoAumento() <= 0) {
                logger.warn("Contrato ID {} no tiene periodoAumento valido. No se actualizara fechaAumento.",
                           contrato.getId());
                return;
            }

            // Validar que tenga fechaAumento actual
            if (contrato.getFechaAumento() == null || contrato.getFechaAumento().isEmpty() ||
                contrato.getFechaAumento().equalsIgnoreCase("No aumenta mas")) {
                logger.debug("Contrato ID {} no tiene fechaAumento valida para actualizar.",
                           contrato.getId());
                return;
            }

            // Parsear fechaAumento actual
            LocalDate fechaAumentoActual = LocalDate.parse(contrato.getFechaAumento(), FORMATO_FECHA);

            // Calcular nueva fechaAumento: fechaAumentoActual + periodoAumento (meses)
            // Siempre establecer como día 1 del mes resultante
            LocalDate nuevaFechaAumento = fechaAumentoActual.plusMonths(contrato.getPeriodoAumento())
                .withDayOfMonth(1);

            // Verificar si supera la fechaFin
            if (contrato.getFechaFin() != null && !contrato.getFechaFin().isEmpty()) {
                LocalDate fechaFin = LocalDate.parse(contrato.getFechaFin(), FORMATO_FECHA);

                if (nuevaFechaAumento.isAfter(fechaFin)) {
                    // Si la nueva fechaAumento supera la fechaFin, marcar como "No aumenta más"
                    contrato.setFechaAumento("No aumenta más");
                    contratoRepository.save(contrato);
                    logger.info("Contrato ID {} - FechaAumento actualizada a 'No aumenta mas' (superaria fechaFin: {})",
                               contrato.getId(), fechaFin);
                    return;
                }
            }

            // Actualizar fechaAumento
            String nuevaFechaAumentoStr = nuevaFechaAumento.format(FORMATO_FECHA);
            contrato.setFechaAumento(nuevaFechaAumentoStr);
            contratoRepository.save(contrato);

            logger.info("Contrato ID {} - FechaAumento actualizada de {} a {}",
                       contrato.getId(), fechaAumentoActual.format(FORMATO_FECHA), nuevaFechaAumentoStr);

        } catch (Exception e) {
            logger.error("Error al actualizar fechaAumento del contrato ID {}: {}",
                        contrato.getId(), e.getMessage(), e);
        }
    }

    /**
     * Determina si un contrato debe recibir aumento en su próximo alquiler
     * Basado en el atributo fechaAumento del contrato
     * VALIDACIÓN CORRECTA: Verifica que el mes y año de fechaAumento coincidan con el mes y año actual
     *
     * @param contrato El contrato a evaluar
     * @return true si debe aplicar aumento, false en caso contrario
     */
    private boolean debeAplicarAumento(Contrato contrato) {
        // Si no tiene fecha de aumento configurada, no aumenta
        if (contrato.getFechaAumento() == null || contrato.getFechaAumento().isEmpty()) {
            return false;
        }

        // Si dice "No aumenta más" o similar, no aumenta
        if (contrato.getFechaAumento().equalsIgnoreCase("No aumenta más") ||
            contrato.getFechaAumento().equalsIgnoreCase("No aumenta mas")) {
            return false;
        }

        try {
            // Parsear la fecha de aumento
            LocalDate fechaAumento = LocalDate.parse(contrato.getFechaAumento(), FORMATO_FECHA);
            LocalDate fechaActual = clockService.getCurrentDate();

            // ✅ VALIDACIÓN CORRECTA: Verificar que el MES y AÑO sean iguales
            // Si fechaAumento es 2025-06-01 y estamos en junio 2025, debe aumentar
            // Si fechaAumento es 2025-06-01 y estamos en julio 2025 o posterior, también debe aumentar (aumento atrasado)
            boolean mesYAnioCoinciden = fechaAumento.getYear() == fechaActual.getYear() &&
                                        fechaAumento.getMonthValue() == fechaActual.getMonthValue();

            // También permitir aumentos atrasados (si la fecha de aumento ya pasó)
            boolean aumentoAtrasado = fechaActual.isAfter(fechaAumento);

            boolean debeAumentar = mesYAnioCoinciden || aumentoAtrasado;

            if (debeAumentar) {
                logger.debug("Contrato ID {} debe aplicar aumento. Fecha de aumento: {} (mes: {}/año: {}), Fecha actual: {} (mes: {}/año: {})",
                           contrato.getId(), fechaAumento, fechaAumento.getMonthValue(), fechaAumento.getYear(),
                           fechaActual, fechaActual.getMonthValue(), fechaActual.getYear());
            }

            return debeAumentar;

        } catch (Exception e) {
            logger.warn("Error al parsear fecha de aumento del contrato ID {}: {}. No se aplicara aumento.",
                       contrato.getId(), e.getMessage());
            return false;
        }
    }

    /**
     * Fuerza la creación de un alquiler para un contrato recién creado
     * Este método se ejecuta al crear un nuevo contrato para asegurar que tenga su primer alquiler
     *
     * @param contratoId ID del contrato recién creado
     * @return true si se creó el alquiler, false en caso contrario
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean generarAlquilerParaNuevoContrato(Long contratoId) {
        try {
            logger.info("Forzando generacion de alquiler para nuevo contrato ID: {}", contratoId);

            Optional<Contrato> contratoOpt = contratoRepository.findById(contratoId);
            if (!contratoOpt.isPresent()) {
                logger.warn("Contrato no encontrado con ID: {}", contratoId);
                return false;
            }

            Contrato contrato = contratoOpt.get();

            // Verificar que el contrato esté vigente
            if (!"Vigente".equals(contrato.getEstadoContrato().getNombre())) {
                logger.debug("Contrato ID {} no esta vigente, se omite creación de alquiler", contratoId);
                return false;
            }

            // Verificar si ya tiene alquileres pendientes
            List<Alquiler> alquileresPendientes =
                alquilerRepository.findAlquileresPendientesByContratoId(contratoId);

            if (!alquileresPendientes.isEmpty()) {
                logger.debug("Contrato ID {} ya tiene alquileres pendientes", contratoId);
                return false;
            }

            // Crear nuevo alquiler con vencimiento el día 10 del mes actual
            LocalDate fechaActual = clockService.getCurrentDate();
            LocalDate fechaVencimiento = LocalDate.of(fechaActual.getYear(), fechaActual.getMonth(), 10);
            String fechaVencimientoISO = fechaVencimiento.format(FORMATO_FECHA);

            Alquiler nuevoAlquiler = new Alquiler(contrato, fechaVencimientoISO, contrato.getMonto());
            nuevoAlquiler.setEsActivo(true);
            alquilerRepository.save(nuevoAlquiler);

            logger.info("Alquiler forzado creado para nuevo contrato ID: {} - Monto: {}",
                       contratoId, contrato.getMonto());
            return true;

        } catch (Exception e) {
            logger.error("Error al generar alquiler para nuevo contrato ID {}: {}",
                        contratoId, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Obtiene el último mes procesado (método público para consulta)
     *
     * @return El último mes procesado en formato MM/yyyy
     */
    public String getUltimoMesProcesado() {
        return obtenerUltimoMesProcesado();
    }
}

