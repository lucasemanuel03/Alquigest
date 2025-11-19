package com.alquileres.service;

import com.alquileres.dto.*;
import com.alquileres.model.*;
import com.alquileres.repository.AlquilerRepository;
import com.alquileres.repository.ContratoRepository;
import com.alquileres.exception.BusinessException;
import com.alquileres.exception.ErrorCodes;
import com.alquileres.util.FechaUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AlquilerService {

    private static final Logger logger = LoggerFactory.getLogger(AlquilerService.class);

    private final AlquilerRepository alquilerRepository;
    private final ContratoRepository contratoRepository;
    private final com.alquileres.repository.PropietarioRepository propietarioRepository;
    private final AumentoAlquilerService aumentoAlquilerService;
    private final AlquilerActualizacionService alquilerActualizacionService;
    private final com.alquileres.util.BCRAApiClient bcraApiClient;

    @Autowired
    ClockService clockService;

    public AlquilerService(
            AlquilerRepository alquilerRepository,
            ContratoRepository contratoRepository,
            com.alquileres.repository.PropietarioRepository propietarioRepository,
            AumentoAlquilerService aumentoAlquilerService,
            AlquilerActualizacionService alquilerActualizacionService,
            com.alquileres.util.BCRAApiClient bcraApiClient) {
        this.alquilerRepository = alquilerRepository;
        this.contratoRepository = contratoRepository;
        this.propietarioRepository = propietarioRepository;
        this.aumentoAlquilerService = aumentoAlquilerService;
        this.alquilerActualizacionService = alquilerActualizacionService;
        this.bcraApiClient = bcraApiClient;
    }

    // Obtener todos los alquileres
    public List<AlquilerDTO> obtenerTodosLosAlquileres() {
        List<Alquiler> alquileres = alquilerRepository.findAll();
        return alquileres.stream()
                .map(AlquilerDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener alquiler por ID
    public AlquilerDTO obtenerAlquilerPorId(Long id) {
        Optional<Alquiler> alquiler = alquilerRepository.findById(id);
        if (alquiler.isPresent()) {
            return new AlquilerDTO(alquiler.get());
        } else {
            throw new BusinessException(ErrorCodes.ALQUILER_NO_ENCONTRADO, "Alquiler no encontrado con ID: " + id, HttpStatus.NOT_FOUND);
        }
    }

    // Obtener alquileres por contrato
    public List<AlquilerDTO> obtenerAlquileresPorContrato(Long contratoId) {
        Optional<Contrato> contrato = contratoRepository.findById(contratoId);
        if (contrato.isEmpty()) {
            throw new BusinessException(ErrorCodes.CONTRATO_NO_ENCONTRADO, "Contrato no encontrado con ID: " + contratoId, HttpStatus.NOT_FOUND);
        }

        List<Alquiler> alquileres = alquilerRepository.findByContratoId(contratoId);
        return alquileres.stream()
                .map(AlquilerDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener alquileres pendientes
    public List<AlquilerDTO> obtenerAlquileresPendientes() {
        List<Alquiler> alquileres = alquilerRepository.findByEstaPagado(false);
        return alquileres.stream()
                .map(AlquilerDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener alquileres pagados
    public List<AlquilerDTO> obtenerAlquileresPagados() {
        List<Alquiler> alquileres = alquilerRepository.findByEstaPagado(true);
        return alquileres.stream()
                .map(AlquilerDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener alquileres pendientes por contrato
    public List<AlquilerDTO> obtenerAlquileresPendientesPorContrato(Long contratoId) {
        Optional<Contrato> contrato = contratoRepository.findById(contratoId);
        if (contrato.isEmpty()) {
            throw new BusinessException(ErrorCodes.CONTRATO_NO_ENCONTRADO, "Contrato no encontrado con ID: " + contratoId, HttpStatus.NOT_FOUND);
        }

        List<Alquiler> alquileres = alquilerRepository.findAlquileresPendientesByContratoId(contratoId);
        return alquileres.stream()
                .map(AlquilerDTO::new)
                .collect(Collectors.toList());
    }

    // Obtener alquileres próximos a vencer
    public List<AlquilerDTO> obtenerAlquileresProximosAVencer(int diasAntes) {
        String fechaActual = clockService.getCurrentDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String fechaLimite = clockService.getCurrentDate().plusDays(diasAntes).format(DateTimeFormatter.ISO_LOCAL_DATE);

        List<Alquiler> alquileres = alquilerRepository.findAlquileresProximosAVencer(fechaActual, fechaLimite);
        return alquileres.stream()
                .map(AlquilerDTO::new)
                .collect(Collectors.toList());
    }

    // Contar alquileres pendientes
    public Long contarAlquileresPendientes() {
        return alquilerRepository.countAlquileresPendientes();
    }

    // Contar alquileres próximos a vencer
    public Long contarAlquileresProximosAVencer(int diasAntes) {
        String fechaActual = clockService.getCurrentDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String fechaLimite = clockService.getCurrentDate().plusDays(diasAntes).format(DateTimeFormatter.ISO_LOCAL_DATE);
        return alquilerRepository.countAlquileresProximosAVencer(fechaActual, fechaLimite);
    }

    // Crear nuevo alquiler
    public AlquilerDTO crearAlquiler(AlquilerCreateDTO alquilerDTO) {
        // Validar que existe el contrato
        Optional<Contrato> contrato = contratoRepository.findById(alquilerDTO.getContratoId());
        if (contrato.isEmpty()) {
            throw new BusinessException(ErrorCodes.CONTRATO_NO_ENCONTRADO, "No existe el contrato indicado", HttpStatus.BAD_REQUEST);
        }

        // Validar que el contrato esté vigente
        if (!"Vigente".equals(contrato.get().getEstadoContrato().getNombre())) {
            throw new BusinessException(ErrorCodes.CONTRATO_NO_VIGENTE, "El contrato no está vigente", HttpStatus.BAD_REQUEST);
        }

        // Validar y convertir fecha de vencimiento
        String fechaVencimientoISO = null;
        if (alquilerDTO.getFechaVencimientoPago() != null && !alquilerDTO.getFechaVencimientoPago().trim().isEmpty()) {
            // Si se proporciona una fecha, validarla y convertirla
            if (!FechaUtil.esFechaValidaUsuario(alquilerDTO.getFechaVencimientoPago())) {
                throw new BusinessException(ErrorCodes.FORMATO_FECHA_INVALIDO,
                    "Formato de fecha de vencimiento inválido. Use dd/MM/yyyy (ej: 25/12/2024)", HttpStatus.BAD_REQUEST);
            }
            try {
                fechaVencimientoISO = FechaUtil.convertirFechaUsuarioToISODate(alquilerDTO.getFechaVencimientoPago());
            } catch (IllegalArgumentException e) {
                throw new BusinessException(ErrorCodes.FORMATO_FECHA_INVALIDO, e.getMessage(), HttpStatus.BAD_REQUEST);
            }
        } else {
            // Si no se proporciona fecha, usar el día 10 del mes actual
            LocalDate fechaActual = clockService.getCurrentDate();
            LocalDate fechaConDia10 = fechaActual.withDayOfMonth(10);
            fechaVencimientoISO = fechaConDia10.format(DateTimeFormatter.ISO_LOCAL_DATE);
        }

        // Crear el alquiler usando el constructor optimizado
        // Solo se setean: contrato, fechaVencimientoPago, monto (del contrato) y estaPagado=false
        // Los campos de pago (cuentaBanco, titularDePago, metodo) quedan null hasta que se registre el pago
        Alquiler alquiler = new Alquiler(contrato.get(), fechaVencimientoISO, contrato.get().getMonto());
        alquiler.setEsActivo(true);

        // Guardar el alquiler
        Alquiler alquilerGuardado = alquilerRepository.save(alquiler);

        return new AlquilerDTO(alquilerGuardado);
    }

    // Actualizar alquiler
    public AlquilerDTO actualizarAlquiler(Long id, AlquilerCreateDTO alquilerDTO) {
        // Verificar que existe el alquiler
        Optional<Alquiler> alquilerExistente = alquilerRepository.findById(id);
        if (alquilerExistente.isEmpty()) {
            throw new BusinessException(ErrorCodes.ALQUILER_NO_ENCONTRADO, "Alquiler no encontrado con ID: " + id, HttpStatus.NOT_FOUND);
        }

        Alquiler alquiler = alquilerExistente.get();

        // Validar y convertir fecha de vencimiento si se proporciona
        if (alquilerDTO.getFechaVencimientoPago() != null && !alquilerDTO.getFechaVencimientoPago().trim().isEmpty()) {
            if (!FechaUtil.esFechaValidaUsuario(alquilerDTO.getFechaVencimientoPago())) {
                throw new BusinessException(ErrorCodes.FORMATO_FECHA_INVALIDO,
                    "Formato de fecha de vencimiento inválido. Use dd/MM/yyyy (ej: 25/12/2024)", HttpStatus.BAD_REQUEST);
            }
            try {
                String fechaVencimientoISO = FechaUtil.convertirFechaUsuarioToISODate(alquilerDTO.getFechaVencimientoPago());
                alquiler.setFechaVencimientoPago(fechaVencimientoISO);
            } catch (IllegalArgumentException e) {
                throw new BusinessException(ErrorCodes.FORMATO_FECHA_INVALIDO, e.getMessage(), HttpStatus.BAD_REQUEST);
            }
        }

        // Guardar cambios
        Alquiler alquilerActualizado = alquilerRepository.save(alquiler);

        return new AlquilerDTO(alquilerActualizado);
    }
    // Marcar alquiler como pagado
    public AlquilerDTO marcarComoPagado(Long id, RegistroPagoDTO registroPagoDTO) {
        // Verificar que existe el alquiler
        Optional<Alquiler> alquilerExistente = alquilerRepository.findById(id);
        if (alquilerExistente.isEmpty()) {
            throw new BusinessException(ErrorCodes.ALQUILER_NO_ENCONTRADO, "Alquiler no encontrado con ID: " + id, HttpStatus.NOT_FOUND);
        }

        Alquiler alquiler = alquilerExistente.get();

        // Marcar como pagado
        alquiler.setEstaPagado(true);

        // Setear la fecha de pago desde el DTO (formato YYYY-MM-DD)
        if (registroPagoDTO.getFechaPago() != null && !registroPagoDTO.getFechaPago().isEmpty()) {
            // Convertir de YYYY-MM-DD a dd/MM/yyyy
            LocalDate fechaPagoDate = LocalDate.parse(registroPagoDTO.getFechaPago());
            alquiler.setFechaPago(fechaPagoDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        } else {
            // Si no viene fecha, usar la fecha actual
            alquiler.setFechaPago(clockService.getCurrentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        }

        // Actualizar información de pago
        if (registroPagoDTO.getCuentaBanco() != null) {
            alquiler.setCuentaBanco(registroPagoDTO.getCuentaBanco());
        }
        if (registroPagoDTO.getTitularDePago() != null) {
            alquiler.setTitularDePago(registroPagoDTO.getTitularDePago());
        }
        if (registroPagoDTO.getMetodo() != null) {
            alquiler.setMetodo(registroPagoDTO.getMetodo());
        }

        // Guardar cambios
        Alquiler alquilerActualizado = alquilerRepository.save(alquiler);

        return new AlquilerDTO(alquilerActualizado);
    }

    // Verificar si existe un alquiler
    public boolean existeAlquiler(Long id) {
        return alquilerRepository.existsById(id);
    }
    // Calcular honorarios (suma de porcentajes específicos de cada contrato para alquileres pagados del mes actual)
    public BigDecimal calcularHonorarios() {
        List<Alquiler> alquileresPagados = alquilerRepository.findAlquileresPagadosDelMes();

        BigDecimal honorariosTotales = alquileresPagados.stream()
                .map(alquiler -> {
                    BigDecimal monto = alquiler.getMonto();
                    if (monto == null) {
                        return BigDecimal.ZERO;
                    }

                    // Obtener el porcentaje de honorario del contrato (por defecto 10%)
                    Contrato contrato = alquiler.getContrato();
                    BigDecimal porcentajeHonorario = contrato.getPorcentajeHonorario();
                    if (porcentajeHonorario == null) {
                        porcentajeHonorario = new BigDecimal("10"); // fallback al 10%
                    }

                    // Calcular honorario: monto * (porcentaje / 100)

                    return monto.multiply(porcentajeHonorario)
                            .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        logger.info("Honorarios calculados: {} (basados en {} alquileres pagados del mes con porcentajes específicos por contrato)",
                   honorariosTotales, alquileresPagados.size());

        return honorariosTotales;
    }

    // Calcular honorario de un alquiler específico (usando el porcentaje del contrato, solo si está pagado)
    public BigDecimal calcularHonorarioAlquilerEspecifico(Long alquilerId) {
        Alquiler alquiler = alquilerRepository.findById(alquilerId)
                .orElseThrow(() -> new RuntimeException("Alquiler no encontrado"));

        // Solo calcular si el alquiler está pagado
        if (alquiler.getEstaPagado()) {
            // Obtener el porcentaje de honorario del contrato (por defecto 10%)
            Contrato contrato = alquiler.getContrato();
            BigDecimal porcentajeHonorario = contrato.getPorcentajeHonorario();
            if (porcentajeHonorario == null) {
                porcentajeHonorario = new BigDecimal("10"); // fallback al 10%
            }

            // Calcular honorario: monto * (porcentaje / 100)
            BigDecimal honorario = alquiler.getMonto()
                    .multiply(porcentajeHonorario)
                    .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);

            logger.info("Honorario calculado para alquiler {}: {} ({}% de {})",
                       alquilerId, honorario, porcentajeHonorario, alquiler.getMonto());
            return honorario;
        } else {
            logger.warn("El alquiler {} no está pagado, no se calcula honorario", alquilerId);
            return BigDecimal.ZERO;
        }
    }

    // Obtener información detallada del alquiler con propietario, inmueble y honorarios
    public AlquilerDetalladoDTO obtenerAlquilerDetallado(Long alquilerId) {
        Alquiler alquiler = alquilerRepository.findById(alquilerId)
                .orElseThrow(() -> new RuntimeException("Alquiler no encontrado"));

        Contrato contrato = alquiler.getContrato();
        Inmueble inmueble = contrato.getInmueble();

        // Obtener propietario usando el propietarioId del inmueble
        Propietario propietario = propietarioRepository.findById(inmueble.getPropietarioId())
                .orElseThrow(() -> new RuntimeException("Propietario no encontrado"));

        // Calcular honorarios (usando el porcentaje del contrato, solo si está pagado)
        BigDecimal honorarios = BigDecimal.ZERO;
        if (alquiler.getEstaPagado()) {
            BigDecimal porcentajeHonorario = contrato.getPorcentajeHonorario();
            if (porcentajeHonorario == null) {
                porcentajeHonorario = new BigDecimal("10"); // fallback al 10%
            }
            honorarios = alquiler.getMonto()
                    .multiply(porcentajeHonorario)
                    .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        }

        return new AlquilerDetalladoDTO(
            alquilerId,
            propietario.getApellido(),
            propietario.getNombre(),
            inmueble.getDireccion(),
            alquiler.getMonto(),
            alquiler.getEstaPagado(),
            honorarios
        );
    }

    // Obtener notificaciones de pago de alquileres no pagados del mes actual
    public List<NotificacionPagoAlquilerDTO> obtenerNotificacionesPagoAlquileresMes() {
        List<Alquiler> alquileresNoPagados = alquilerRepository.findAlquileresNoPagadosDelMes();

        return alquileresNoPagados.stream()
                .map(alquiler -> new NotificacionPagoAlquilerDTO(
                        alquiler.getContrato().getId(),
                        alquiler.getContrato().getInmueble().getId(),
                        alquiler.getContrato().getInquilino().getId(),
                        alquiler.getContrato().getInmueble().getDireccion(),
                        alquiler.getContrato().getInquilino().getApellido(),
                        alquiler.getContrato().getInquilino().getNombre()
                ))
                .collect(Collectors.toList());
    }

    /**
     * Aplica un aumento manual a un alquiler usando índices ICL proporcionados por el usuario
     * Se usa cuando la API del BCRA falla y el alquiler está marcado con necesitaAumentoManual=true
     *
     * @param alquilerId ID del alquiler a actualizar
     * @param indiceInicial Índice ICL inicial
     * @param indiceFinal Índice ICL final
     * @return DTO del alquiler actualizado
     * @throws BusinessException si el alquiler no existe o no necesita aumento manual
     */
    public AlquilerDTO aplicarAumentoManual(Long alquilerId, BigDecimal indiceInicial, BigDecimal indiceFinal) {
        logger.info("Aplicando aumento manual al alquiler ID: {}", alquilerId);

        // Validar que el alquiler existe
        Alquiler alquiler = alquilerRepository.findById(alquilerId)
                .orElseThrow(() -> new BusinessException(
                        "Alquiler no encontrado con ID: " + alquilerId,
                        ErrorCodes.ALQUILER_NO_ENCONTRADO,
                        HttpStatus.NOT_FOUND
                ));

        // Validar que el alquiler necesita aumento manual
        if (!Boolean.TRUE.equals(alquiler.getNecesitaAumentoManual())) {
            throw new BusinessException(
                    "El alquiler ID " + alquilerId + " no está marcado para aumento manual",
                    ErrorCodes.DATOS_INVALIDOS,
                    HttpStatus.BAD_REQUEST
            );
        }

        // Validar índices
        if (indiceInicial == null || indiceFinal == null || indiceInicial.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(
                    "Los índices ICL deben ser mayores a cero",
                    ErrorCodes.DATOS_INVALIDOS,
                    HttpStatus.BAD_REQUEST
            );
        }

        // Calcular tasa de aumento
        BigDecimal tasaAumento = indiceFinal.divide(indiceInicial, 10, java.math.RoundingMode.HALF_UP);

        // Obtener el monto actual (antes del aumento)
        BigDecimal montoAnterior = alquiler.getMonto();

        // Calcular nuevo monto
        BigDecimal nuevoMonto = montoAnterior.multiply(tasaAumento).setScale(2, java.math.RoundingMode.HALF_UP);

        // Calcular porcentaje de aumento
        BigDecimal porcentajeAumento = tasaAumento.subtract(BigDecimal.ONE)
                .multiply(new BigDecimal("100"))
                .setScale(2, BigDecimal.ROUND_HALF_UP);

        logger.info("Alquiler ID {}: Monto anterior: {}, Nuevo monto: {}, Tasa: {}, Porcentaje: {}%",
                alquilerId, montoAnterior, nuevoMonto, tasaAumento, porcentajeAumento);

        // Actualizar el alquiler
        alquiler.setMonto(nuevoMonto);
        alquiler.setNecesitaAumentoManual(false);

        Alquiler alquilerActualizado = alquilerRepository.save(alquiler);

        // Registrar el aumento en el historial
        Contrato contrato = alquiler.getContrato();
        try {
            // Crear y guardar el registro de aumento usando el servicio
            aumentoAlquilerService.crearYGuardarAumento(
                contrato,
                montoAnterior,
                nuevoMonto,
                porcentajeAumento
            );

            logger.info("Aumento manual aplicado y registrado correctamente para alquiler ID: {}", alquilerId);

        } catch (Exception e) {
            logger.error("Error al registrar el aumento en el historial: {}", e.getMessage());
            // No fallar la operación principal si falla el registro del historial
        }

        return new AlquilerDTO(alquilerActualizado);
    }

    /**
     * Obtiene todos los alquileres que necesitan aumento manual
     * Reintenta automáticamente la consulta a la API del BCRA para cada alquiler pendiente
     * Si la consulta tiene éxito, aplica el aumento automáticamente
     *
     * @return Lista de alquileres que aún necesitan aumento manual (los que fallaron el reintento)
     */
    public List<AlquilerDTO> obtenerAlquileresConAumentoManualPendiente() {
        List<Alquiler> alquileres = alquilerRepository.findByNecesitaAumentoManualTrueAndEsActivoTrue();

        logger.info("Encontrados {} alquileres con aumento manual pendiente. Reintentando consulta a API del BCRA...",
                   alquileres.size());

        List<Alquiler> alquileresPendientes = new java.util.ArrayList<>();
        int actualizadosExitosamente = 0;

        for (Alquiler alquiler : alquileres) {
            try {
                Contrato contrato = alquiler.getContrato();

                // Solo reintentar si el contrato aumenta con ICL
                if (!Boolean.TRUE.equals(contrato.getAumentaConIcl())) {
                    logger.warn("Alquiler ID {} no aumenta con ICL, se mantiene en lista de pendientes",
                               alquiler.getId());
                    alquileresPendientes.add(alquiler);
                    continue;
                }

                // Obtener fechas para consultar la API

                // Obtener el ultimo aumento
                AumentoAlquilerDTO aumentoAnterior = aumentoAlquilerService
                        .obtenerUltimoAumento(contrato.getId());

                // fechaInicio es la fecha del aumento anterior si existiera
                String fechaInicio = aumentoAnterior.getFechaAumento();
                // fechaFin es la fecha del alquiler actual
                String fechaFin = alquiler.getFechaVencimientoPago();

                logger.debug("Reintentando consulta API del BCRA para alquiler ID {}: fechaInicio={}, fechaFin={}",
                            alquiler.getId(), fechaInicio, fechaFin);

                // Intentar obtener tasa de aumento de la API del BCRA
                BigDecimal tasaAumento = bcraApiClient.obtenerTasaAumentoICL(fechaInicio, fechaFin);

                // Si llegamos aquí, la consulta fue exitosa
                logger.info("✅ Consulta API exitosa para alquiler ID {}. Tasa obtenida: {}",
                           alquiler.getId(), tasaAumento);

                // Calcular nuevo monto
                BigDecimal montoAnterior = alquiler.getMonto();
                BigDecimal nuevoMonto = montoAnterior.multiply(tasaAumento)
                        .setScale(2, java.math.RoundingMode.HALF_UP);

                // Calcular porcentaje de aumento
                BigDecimal porcentajeAumento = tasaAumento.subtract(BigDecimal.ONE)
                        .multiply(new BigDecimal("100"))
                        .setScale(2, java.math.RoundingMode.HALF_UP);

                // Actualizar el alquiler
                alquiler.setMonto(nuevoMonto);
                alquiler.setNecesitaAumentoManual(false);
                alquilerRepository.save(alquiler);

                // Actualizar fechaAumento de contrato
                alquilerActualizacionService.actualizarFechaAumentoContrato(contrato);

                // Registrar el aumento en el historial
                aumentoAlquilerService.crearYGuardarAumento(
                        contrato,
                        montoAnterior,
                        nuevoMonto,
                        porcentajeAumento
                );

                logger.info("Alquiler ID {} actualizado automáticamente. Monto: {} -> {}. Porcentaje: {}%",
                           alquiler.getId(), montoAnterior, nuevoMonto, porcentajeAumento);

                actualizadosExitosamente++;

            } catch (Exception e) {
                // Si falla el reintento, mantener el alquiler en la lista de pendientes
                logger.warn("Fallo al reintentar consulta API para alquiler ID {}: {}. Se mantiene pendiente.",
                           alquiler.getId(), e.getMessage());
                alquileresPendientes.add(alquiler);
            }
        }

        logger.info("Reintento completado: {} alquileres actualizados exitosamente, {} aún pendientes",
                   actualizadosExitosamente, alquileresPendientes.size());

        return alquileresPendientes.stream()
                .map(AlquilerDTO::new)
                .collect(Collectors.toList());
    }
}
