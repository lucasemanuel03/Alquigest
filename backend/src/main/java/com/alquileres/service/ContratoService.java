package com.alquileres.service;

import com.alquileres.dto.ContratoDTO;
import com.alquileres.dto.ContratoCreateDTO;
import com.alquileres.dto.EstadoContratoUpdateDTO;
import com.alquileres.model.Contrato;
import com.alquileres.model.Inmueble;
import com.alquileres.model.Inquilino;
import com.alquileres.model.EstadoContrato;
import com.alquileres.model.EstadoInmueble;
import com.alquileres.model.Propietario;
import com.alquileres.model.TipoInmueble;
import com.alquileres.model.CancelacionContrato;
import com.alquileres.model.MotivoCancelacion;
import com.alquileres.model.PDF;
import com.alquileres.model.Alquiler;
import com.alquileres.model.AumentoAlquiler;
import com.alquileres.repository.ContratoRepository;
import com.alquileres.repository.InmuebleRepository;
import com.alquileres.repository.InquilinoRepository;
import com.alquileres.repository.EstadoContratoRepository;
import com.alquileres.repository.EstadoInmuebleRepository;
import com.alquileres.repository.PropietarioRepository;
import com.alquileres.repository.TipoInmuebleRepository;
import com.alquileres.repository.CancelacionContratoRepository;
import com.alquileres.repository.MotivoCancelacionRepository;
import com.alquileres.repository.AlquilerRepository;
import com.alquileres.exception.BusinessException;
import com.alquileres.exception.ErrorCodes;
import com.alquileres.util.FechaUtil;
import com.alquileres.util.BCRAApiClient;
import com.alquileres.security.EncryptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ContratoService {

    private static final Logger logger = LoggerFactory.getLogger(ContratoService.class);

    private final ContratoRepository contratoRepository;
    private final InmuebleRepository inmuebleRepository;
    private final InquilinoRepository inquilinoRepository;
    private final EstadoContratoRepository estadoContratoRepository;
    private final EstadoInmuebleRepository estadoInmuebleRepository;
    private final PropietarioRepository propietarioRepository;
    private final TipoInmuebleRepository tipoInmuebleRepository;
    private final CancelacionContratoRepository cancelacionContratoRepository;
    private final MotivoCancelacionRepository motivoCancelacionRepository;
    private final AlquilerRepository alquilerRepository;
    private final ServicioContratoService servicioContratoService;
    private final EncryptionService encryptionService;
    private final PDFService pdfService;
    private final BCRAApiClient bcraApiClient;
    private final ClockService clockService;

    public ContratoService(
            ContratoRepository contratoRepository,
            InmuebleRepository inmuebleRepository,
            InquilinoRepository inquilinoRepository,
            EstadoContratoRepository estadoContratoRepository,
            EstadoInmuebleRepository estadoInmuebleRepository,
            PropietarioRepository propietarioRepository,
            TipoInmuebleRepository tipoInmuebleRepository,
            CancelacionContratoRepository cancelacionContratoRepository,
            MotivoCancelacionRepository motivoCancelacionRepository,
            AlquilerRepository alquilerRepository,
            ServicioContratoService servicioContratoService,
            EncryptionService encryptionService,
            PDFService pdfService,
            BCRAApiClient bcraApiClient,
            ClockService clockService) {
        this.contratoRepository = contratoRepository;
        this.inmuebleRepository = inmuebleRepository;
        this.inquilinoRepository = inquilinoRepository;
        this.estadoContratoRepository = estadoContratoRepository;
        this.estadoInmuebleRepository = estadoInmuebleRepository;
        this.propietarioRepository = propietarioRepository;
        this.tipoInmuebleRepository = tipoInmuebleRepository;
        this.cancelacionContratoRepository = cancelacionContratoRepository;
        this.motivoCancelacionRepository = motivoCancelacionRepository;
        this.alquilerRepository = alquilerRepository;
        this.servicioContratoService = servicioContratoService;
        this.encryptionService = encryptionService;
        this.pdfService = pdfService;
        this.bcraApiClient = bcraApiClient;
        this.clockService = clockService;
    }

    @Autowired
    private AumentoAlquilerService aumentoAlquilerService;

    /**
     * Enriquece un ContratoDTO con información adicional del propietario, inmueble y alquiler
     * 
     * Este método transforma un objeto Contrato en un DTO completo con:
     * - Fechas convertidas al formato del usuario (dd/MM/yyyy)
     * - Información completa del propietario (incluyendo clave fiscal desencriptada)
     * - Tipo de inmueble
     * - Monto del último alquiler
     * 
     * @param contrato El contrato a enriquecer
     * @return ContratoDTO con toda la información adicional
     */
    private ContratoDTO enrichContratoDTO(Contrato contrato) {
        ContratoDTO contratoDTO = new ContratoDTO(contrato);

        // Convertir fechas de formato ISO (yyyy-MM-dd) a formato usuario (dd/MM/yyyy)
        convertirFechasParaRespuesta(contrato, contratoDTO);

        // Agregar información del propietario
        agregarInformacionPropietario(contrato, contratoDTO);

        // Agregar tipo de inmueble
        agregarTipoInmueble(contrato, contratoDTO);

        // Agregar monto del último alquiler
        agregarMontoUltimoAlquiler(contrato, contratoDTO);

        return contratoDTO;
    }

    /**
     * Convierte las fechas del contrato de formato ISO a formato usuario
     * 
     * @param contrato Contrato fuente con fechas en formato ISO
     * @param contratoDTO DTO destino donde se setean las fechas convertidas
     */
    private void convertirFechasParaRespuesta(Contrato contrato, ContratoDTO contratoDTO) {
        if (contrato.getFechaInicio() != null) {
            contratoDTO.setFechaInicio(FechaUtil.convertirFechaISOToUsuario(contrato.getFechaInicio()));
        }
        if (contrato.getFechaFin() != null) {
            contratoDTO.setFechaFin(FechaUtil.convertirFechaISOToUsuario(contrato.getFechaFin()));
        }
        if (contrato.getFechaAumento() != null) {
            contratoDTO.setFechaAumento(FechaUtil.convertirFechaISOToUsuario(contrato.getFechaAumento()));
        }
    }

    /**
     * Agrega la información completa del propietario al DTO del contrato
     * 
     * Obtiene el propietario a través del inmueble e incluye la clave fiscal desencriptada
     * 
     * @param contrato Contrato con referencia al inmueble
     * @param contratoDTO DTO donde se setea la información del propietario
     */
    private void agregarInformacionPropietario(Contrato contrato, ContratoDTO contratoDTO) {
        if (contrato.getInmueble() == null || contrato.getInmueble().getPropietarioId() == null) {
            return;
        }

        Optional<Propietario> propietarioOpt = propietarioRepository.findById(
            contrato.getInmueble().getPropietarioId()
        );
        
        if (propietarioOpt.isEmpty()) {
            return;
        }

        Propietario propietario = propietarioOpt.get();
        
        // Setear datos básicos del propietario
        contratoDTO.setNombrePropietario(propietario.getNombre());
        contratoDTO.setApellidoPropietario(propietario.getApellido());
        contratoDTO.setDniPropietario(propietario.getCuil());
        contratoDTO.setTelefonoPropietario(propietario.getTelefono());
        contratoDTO.setEmailPropietario(propietario.getEmail());
        contratoDTO.setDireccionPropietario(propietario.getDireccion());

        // Desencriptar y agregar clave fiscal si existe
        desencriptarYAgregarClaveFiscal(propietario, contratoDTO);
    }

    /**
     * Desencripta la clave fiscal del propietario y la agrega al DTO
     * 
     * Si hay algún error en la desencriptación, se setea como null
     * 
     * @param propietario Propietario con clave fiscal encriptada
     * @param contratoDTO DTO donde se setea la clave fiscal desencriptada
     */
    private void desencriptarYAgregarClaveFiscal(Propietario propietario, ContratoDTO contratoDTO) {
        if (propietario.getClaveFiscal() == null || propietario.getClaveFiscal().trim().isEmpty()) {
            return;
        }

        try {
            String claveFiscalDesencriptada = encryptionService.desencriptar(propietario.getClaveFiscal());
            contratoDTO.setClaveFiscalPropietario(claveFiscalDesencriptada);
        } catch (Exception e) {
            logger.error("Error desencriptando clave fiscal del propietario ID: {}", 
                propietario.getId(), e);
            contratoDTO.setClaveFiscalPropietario(null);
        }
    }

    /**
     * Agrega el nombre del tipo de inmueble al DTO del contrato
     * 
     * @param contrato Contrato con referencia al inmueble
     * @param contratoDTO DTO donde se setea el tipo de inmueble
     */
    private void agregarTipoInmueble(Contrato contrato, ContratoDTO contratoDTO) {
        if (contrato.getInmueble() == null || contrato.getInmueble().getTipoInmuebleId() == null) {
            return;
        }

        Optional<TipoInmueble> tipoInmuebleOpt = tipoInmuebleRepository.findById(
            contrato.getInmueble().getTipoInmuebleId()
        );
        
        tipoInmuebleOpt.ifPresent(tipoInmueble -> 
            contratoDTO.setTipoInmueble(tipoInmueble.getNombre())
        );
    }

    /**
     * Agrega el monto del último alquiler al DTO del contrato
     * 
     * @param contrato Contrato del cual obtener el último alquiler
     * @param contratoDTO DTO donde se setea el monto
     */
    private void agregarMontoUltimoAlquiler(Contrato contrato, ContratoDTO contratoDTO) {
        Optional<com.alquileres.model.Alquiler> ultimoAlquilerOpt = 
            alquilerRepository.findUltimoAlquilerByContratoId(contrato.getId());
        
        ultimoAlquilerOpt.ifPresent(alquiler -> 
            contratoDTO.setMontoUltimoAlquiler(alquiler.getMonto())
        );
    }

    /**
     * Obtiene todos los contratos del sistema
     * 
     * Los resultados se cachean para mejorar el rendimiento
     * 
     * @return Lista de todos los contratos con información enriquecida
     */
    @Cacheable(value = "contratos", key = "'all'")
    public List<ContratoDTO> obtenerTodosLosContratos() {
        List<Contrato> contratos = contratoRepository.findAll();
        return contratos.stream()
                .map(this::enrichContratoDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene un contrato por su ID
     * 
     * @param id ID del contrato a buscar
     * @return ContratoDTO con información completa
     * @throws BusinessException si el contrato no existe
     */
    @Cacheable(value = "contratos", key = "#id")
    public ContratoDTO obtenerContratoPorId(Long id) {
        Contrato contrato = contratoRepository.findById(id)
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.CONTRATO_NO_ENCONTRADO, 
                "Contrato no encontrado con ID: " + id, 
                HttpStatus.NOT_FOUND
            ));
        
        return enrichContratoDTO(contrato);
    }

    /**
     * Obtiene todos los contratos asociados a un inmueble específico
     * 
     * @param inmuebleId ID del inmueble
     * @return Lista de contratos del inmueble
     * @throws BusinessException si el inmueble no existe
     */
    @Cacheable(value = "contratos", key = "'inmueble_' + #inmuebleId")
    public List<ContratoDTO> obtenerContratosPorInmueble(Long inmuebleId) {
        Inmueble inmueble = inmuebleRepository.findById(inmuebleId)
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.INMUEBLE_NO_ENCONTRADO, 
                "Inmueble no encontrado con ID: " + inmuebleId, 
                HttpStatus.NOT_FOUND
            ));

        List<Contrato> contratos = contratoRepository.findByInmueble(inmueble);
        return contratos.stream()
                .map(this::enrichContratoDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todos los contratos asociados a un inquilino específico
     * 
     * @param inquilinoId ID del inquilino
     * @return Lista de contratos del inquilino
     * @throws BusinessException si el inquilino no existe
     */
    @Cacheable(value = "contratos", key = "'inquilino_' + #inquilinoId")
    public List<ContratoDTO> obtenerContratosPorInquilino(Long inquilinoId) {
        Inquilino inquilino = inquilinoRepository.findById(inquilinoId)
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.INQUILINO_NO_ENCONTRADO, 
                "Inquilino no encontrado con ID: " + inquilinoId, 
                HttpStatus.NOT_FOUND
            ));

        List<Contrato> contratos = contratoRepository.findByInquilino(inquilino);
        return contratos.stream()
                .map(this::enrichContratoDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todos los contratos que están actualmente vigentes
     * 
     * Un contrato vigente es aquel cuyo estado es "Vigente"
     * 
     * @return Lista de contratos vigentes
     */
    @Cacheable(value = "contratos", key = "'vigentes'")
    public List<ContratoDTO> obtenerContratosVigentes() {
        List<Contrato> contratos = contratoRepository.findContratosVigentes();
        return contratos.stream()
                .map(this::enrichContratoDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todos los contratos que no están vigentes
     * 
     * Incluye contratos cancelados, finalizados, etc.
     * 
     * @return Lista de contratos no vigentes
     */
    @Cacheable(value = "contratos", key = "'no_vigentes'")
    public List<ContratoDTO> obtenerContratosNoVigentes() {
        List<Contrato> contratos = contratoRepository.findContratosNoVigentes();
        return contratos.stream()
                .map(this::enrichContratoDTO)
                .collect(Collectors.toList());
    }

    /**
     * Cuenta la cantidad total de contratos vigentes
     * 
     * @return Cantidad de contratos vigentes
     */
    @Cacheable(value = "contratos", key = "'count_vigentes'")
    public Long contarContratosVigentes() {
        return contratoRepository.countContratosVigentes();
    }

    /**
     * Obtiene los contratos vigentes que vencen dentro de un período determinado
     * 
     * Útil para alertas y notificaciones de vencimientos próximos
     * 
     * @param diasAntes Número de días hacia adelante para buscar vencimientos
     * @return Lista de contratos próximos a vencer
     */
    @Cacheable(value = "contratos-por-vencer", key = "'proximos_' + #diasAntes")
    public List<ContratoDTO> obtenerContratosProximosAVencer(int diasAntes) {
        String fechaActual = clockService.getCurrentDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String fechaLimite = clockService.getCurrentDate().plusDays(diasAntes).format(DateTimeFormatter.ISO_LOCAL_DATE);

        List<Contrato> contratos = contratoRepository.findContratosVigentesProximosAVencer(
            fechaActual, 
            fechaLimite
        );
        
        return contratos.stream()
                .map(this::enrichContratoDTO)
                .collect(Collectors.toList());
    }

    /**
     * Cuenta los contratos vigentes que vencen dentro de un período determinado
     * 
     * @param diasAntes Número de días hacia adelante para buscar vencimientos
     * @return Cantidad de contratos próximos a vencer
     */
    @Cacheable(value = "contratos-por-vencer", key = "'count_proximos_' + #diasAntes")
    public Long contarContratosProximosAVencer(int diasAntes) {
        String fechaActual = clockService.getCurrentDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String fechaLimite = clockService.getCurrentDate().plusDays(diasAntes).format(DateTimeFormatter.ISO_LOCAL_DATE);

        return contratoRepository.countContratosVigentesProximosAVencer(fechaActual, fechaLimite);
    }

    /**
     * Crea un nuevo contrato en el sistema
     * 
     * Este método realiza las siguientes operaciones:
     * 1. Valida que existan el inmueble e inquilino
     * 2. Verifica que el inmueble esté disponible
     * 3. Procesa y valida las fechas del contrato
     * 4. Calcula la fecha de primer aumento
     * 5. Crea el contrato y actualiza estados de inmueble e inquilino
     * 6. Genera el primer alquiler si el contrato queda vigente
     * 
     * @param contratoDTO DTO con los datos del contrato a crear
     * @return ContratoDTO del contrato creado con información completa
     * @throws BusinessException si hay errores de validación
     */
    @Transactional
    @CacheEvict(value = {"contratos", "inmuebles", "inquilinos", "propietarios"}, allEntries = true)
    public ContratoDTO crearContrato(ContratoCreateDTO contratoDTO) {
        // Paso 1: Validar entidades relacionadas
        Inmueble inmueble = validarYObtenerInmueble(contratoDTO.getInmuebleId());
        Inquilino inquilino = validarYObtenerInquilino(contratoDTO.getInquilinoId());
        
        // Paso 2: Validar disponibilidad del inmueble
        validarDisponibilidadInmueble(inmueble);
        
        // Paso 3: Obtener o asignar estado del contrato
        EstadoContrato estadoContrato = obtenerEstadoContrato(contratoDTO.getEstadoContratoId());
        
        // Paso 4: Pre-cargar estado "Alquilado" si será necesario
        EstadoInmueble estadoAlquilado = precargarEstadoAlquilado(estadoContrato);
        
        // Paso 5: Procesar y validar fechas del contrato
        FechasContrato fechas = procesarYValidarFechas(contratoDTO);
        
        // Paso 6: Crear y guardar el contrato
        Contrato contratoGuardado = crearYGuardarContrato(
            contratoDTO, 
            inmueble, 
            inquilino, 
            estadoContrato, 
            fechas
        );
        
        // Paso 7: Actualizar estados si el contrato queda vigente
        if ("Vigente".equals(estadoContrato.getNombre())) {
            actualizarEstadosParaContratoVigente(contratoGuardado, inmueble, inquilino, estadoAlquilado);
            
            // Verificar si la fecha de inicio es anterior a la fecha actual
            LocalDate fechaInicioDate = LocalDate.parse(fechas.fechaInicio, DateTimeFormatter.ISO_LOCAL_DATE);
            LocalDate fechaActual = LocalDate.now();
            
            if (fechaInicioDate.isBefore(fechaActual)) {
                // Si la fecha de inicio es anterior a hoy, generar alquileres retroactivos
                logger.info("Contrato ID {} tiene fecha de inicio en el pasado ({}). Generando alquileres retroactivos.",
                           contratoGuardado.getId(), fechas.fechaInicio);
                crearAlquileresRetroactivos(contratoGuardado, fechaInicioDate, fechaActual);
            } else {
                // Si la fecha de inicio es hoy o futura, generar solo el primer alquiler
                generarPrimerAlquiler(contratoGuardado);
            }
            
            // NOTA: Los servicios ya NO se crean automáticamente aquí.
            // El frontend envía explícitamente qué servicios crear mediante POST a /api/servicios-contrato
        }
        
        return enrichContratoDTO(contratoGuardado);
    }

    /**
     * Valida que el inmueble exista y lo retorna
     * 
     * @param inmuebleId ID del inmueble a validar
     * @return Inmueble encontrado
     * @throws BusinessException si el inmueble no existe
     */
    private Inmueble validarYObtenerInmueble(Long inmuebleId) {
        return inmuebleRepository.findById(inmuebleId)
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.INMUEBLE_NO_ENCONTRADO, 
                "No existe el inmueble indicado", 
                HttpStatus.BAD_REQUEST
            ));
    }

    /**
     * Valida que el inquilino exista y lo retorna
     * 
     * @param inquilinoId ID del inquilino a validar
     * @return Inquilino encontrado
     * @throws BusinessException si el inquilino no existe
     */
    private Inquilino validarYObtenerInquilino(Long inquilinoId) {
        return inquilinoRepository.findById(inquilinoId)
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.INQUILINO_NO_ENCONTRADO, 
                "No existe el inquilino indicado", 
                HttpStatus.BAD_REQUEST
            ));
    }

    /**
     * Valida que el inmueble no tenga un contrato vigente y esté en estado "Disponible"
     *
     * @param inmueble Inmueble a validar
     * @throws BusinessException si el inmueble ya está alquilado o no está en estado "Disponible"
     */
    private void validarDisponibilidadInmueble(Inmueble inmueble) {
        if (contratoRepository.existsContratoVigenteByInmueble(inmueble)) {
            throw new BusinessException(
                ErrorCodes.INMUEBLE_YA_ALQUILADO, 
                "El inmueble ya tiene un contrato vigente", 
                HttpStatus.BAD_REQUEST
            );
        }

        // Validar que el inmueble esté en estado "Disponible"
        Optional<EstadoInmueble> estadoInmuebleOpt = estadoInmuebleRepository.findById(inmueble.getEstado());
        if (estadoInmuebleOpt.isPresent()) {
            String nombreEstado = estadoInmuebleOpt.get().getNombre();
            if (!"Disponible".equals(nombreEstado)) {
                throw new BusinessException(
                    ErrorCodes.INMUEBLE_NO_DISPONIBLE,
                    "El inmueble debe estar en estado 'Disponible' para crear un contrato. Estado actual: " + nombreEstado,
                    HttpStatus.BAD_REQUEST
                );
            }
        } else {
            throw new BusinessException(
                ErrorCodes.ESTADO_INMUEBLE_NO_ENCONTRADO,
                "No se pudo verificar el estado del inmueble",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Obtiene el estado del contrato especificado o asigna "Vigente" por defecto
     * 
     * @param estadoContratoId ID del estado (puede ser null para usar defecto)
     * @return EstadoContrato a asignar al contrato
     * @throws BusinessException si el estado especificado no existe
     */
    private EstadoContrato obtenerEstadoContrato(Integer estadoContratoId) {
        if (estadoContratoId != null) {
            return estadoContratoRepository.findById(estadoContratoId)
                .orElseThrow(() -> new BusinessException(
                    ErrorCodes.ESTADO_CONTRATO_NO_ENCONTRADO, 
                    "No existe el estado de contrato indicado", 
                    HttpStatus.BAD_REQUEST
                ));
        }
        
        // Si no se proporciona estado, asignar "Vigente" por defecto
        return estadoContratoRepository.findByNombre("Vigente")
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.ESTADO_CONTRATO_NO_ENCONTRADO, 
                "No se pudo asignar el estado por defecto", 
                HttpStatus.INTERNAL_SERVER_ERROR
            ));
    }

    /**
     * Pre-carga el estado "Alquilado" si será necesario para optimizar
     * 
     * @param estadoContrato Estado del contrato que se está creando
     * @return EstadoInmueble "Alquilado" o null si no es necesario
     */
    private EstadoInmueble precargarEstadoAlquilado(EstadoContrato estadoContrato) {
        if ("Vigente".equals(estadoContrato.getNombre())) {
            return estadoInmuebleRepository.findByNombre("Alquilado").orElse(null);
        }
        return null;
    }

    /**
     * Procesa y valida todas las fechas del contrato
     * 
     * Convierte fechas del formato usuario (dd/MM/yyyy) a formato ISO (yyyy-MM-dd)
     * y realiza todas las validaciones lógicas necesarias
     * 
     * @param contratoDTO DTO con las fechas en formato usuario
     * @return FechasContrato con fechas validadas en formato ISO
     * @throws BusinessException si las fechas son inválidas
     */
    private FechasContrato procesarYValidarFechas(ContratoCreateDTO contratoDTO) {
        // Convertir fechas del usuario a formato ISO
        String fechaInicioISO = convertirYValidarFecha(
            contratoDTO.getFechaInicio(), 
            "fecha de inicio"
        );
        String fechaFinISO = convertirYValidarFecha(
            contratoDTO.getFechaFin(), 
            "fecha de fin"
        );
        
        // Validar lógica de fechas
        validarLogicaFechas(fechaInicioISO, fechaFinISO);
        
        // Calcular fecha de primer aumento
        String fechaAumentoCalculada = calcularFechaAumento(
            fechaInicioISO, 
            fechaFinISO, 
            contratoDTO.getPeriodoAumento()
        );
        
        return new FechasContrato(fechaInicioISO, fechaFinISO, fechaAumentoCalculada);
    }

    /**
     * Convierte y valida una fecha del formato usuario a formato ISO
     * 
     * @param fechaUsuario Fecha en formato dd/MM/yyyy
     * @param nombreCampo Nombre del campo para mensajes de error
     * @return Fecha en formato ISO (yyyy-MM-dd) o null si no se proporcionó
     * @throws BusinessException si el formato es inválido
     */
    private String convertirYValidarFecha(String fechaUsuario, String nombreCampo) {
        if (fechaUsuario == null) {
            return null;
        }
        
        if (!FechaUtil.esFechaValidaUsuario(fechaUsuario)) {
            throw new BusinessException(
                ErrorCodes.FORMATO_FECHA_INVALIDO,
                "Formato de " + nombreCampo + " inválido. Use dd/MM/yyyy (ej: 25/12/2024)", 
                HttpStatus.BAD_REQUEST
            );
        }
        
        try {
            return FechaUtil.convertirFechaUsuarioToISODate(fechaUsuario);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(
                ErrorCodes.FORMATO_FECHA_INVALIDO, 
                e.getMessage(), 
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Valida la lógica de las fechas del contrato
     * 
     * Verifica que:
     * - La fecha fin no sea anterior a la fecha inicio
     * - La fecha fin no sea anterior a la fecha actual
     * 
     * @param fechaInicioISO Fecha de inicio en formato ISO
     * @param fechaFinISO Fecha de fin en formato ISO
     * @throws BusinessException si las fechas no cumplen las reglas
     */
    private void validarLogicaFechas(String fechaInicioISO, String fechaFinISO) {
        String fechaActualISO = LocalDate.now().toString();
        
        // Validar que fecha fin no sea anterior a fecha inicio
        if (fechaInicioISO != null && fechaFinISO != null) {
            if (FechaUtil.compararFechas(fechaFinISO, fechaInicioISO) < 0) {
                throw new BusinessException(
                    ErrorCodes.RANGO_DE_FECHAS_INVALIDO, 
                    "La fecha de fin no puede ser anterior a la fecha de inicio", 
                    HttpStatus.BAD_REQUEST
                );
            }
        }
        
        // Validar que fecha fin no sea anterior a fecha actual
        if (fechaFinISO != null && FechaUtil.compararFechas(fechaFinISO, fechaActualISO) < 0) {
            throw new BusinessException(
                ErrorCodes.RANGO_DE_FECHAS_INVALIDO,
                "La fecha de fin no puede ser anterior a la fecha actual", 
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Calcula la fecha del primer aumento del contrato
     * 
     * La fecha de aumento se calcula sumando el período de aumento (en meses)
     * a la fecha de inicio y ajustándola al día 1 del mes resultante
     * 
     * @param fechaInicioISO Fecha de inicio en formato ISO
     * @param fechaFinISO Fecha de fin en formato ISO
     * @param periodoAumento Período de aumento en meses
     * @return Fecha de aumento calculada o "No aumenta más" si excede la fecha fin
     */
    private String calcularFechaAumento(String fechaInicioISO, String fechaFinISO, Integer periodoAumento) {
        if (fechaInicioISO == null || periodoAumento == null || periodoAumento <= 0) {
            return null;
        }
        
        try {
            String fechaCalculada = FechaUtil.agregarMesesDate(fechaInicioISO, periodoAumento);
            
            // Convertir al día 1 del mes calculado (ej: 2025-06-20 → 2025-06-01)
            LocalDate fecha = LocalDate.parse(fechaCalculada, DateTimeFormatter.ISO_LOCAL_DATE);
            LocalDate fechaDia1 = fecha.withDayOfMonth(1);
            String fechaAumentoCalculada = fechaDia1.format(DateTimeFormatter.ISO_LOCAL_DATE);
            
            // Validar que la fecha de aumento no supere la fecha fin
            if (fechaFinISO != null && FechaUtil.compararFechas(fechaAumentoCalculada, fechaFinISO) > 0) {
                return "No aumenta más";
            }
            
            return fechaAumentoCalculada;
        } catch (IllegalArgumentException e) {
            throw new BusinessException(
                ErrorCodes.ERROR_CALCULO_FECHA, 
                "Error calculando fecha de aumento: " + e.getMessage(), 
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Crea y guarda el objeto Contrato con todos sus datos
     * 
     * @param contratoDTO DTO con los datos del contrato
     * @param inmueble Inmueble asociado al contrato
     * @param inquilino Inquilino asociado al contrato
     * @param estadoContrato Estado del contrato
     * @param fechas Objeto con las fechas procesadas del contrato
     * @return Contrato guardado en la base de datos
     */
    private Contrato crearYGuardarContrato(
            ContratoCreateDTO contratoDTO,
            Inmueble inmueble,
            Inquilino inquilino,
            EstadoContrato estadoContrato,
            FechasContrato fechas) {
        
        Contrato contrato = new Contrato();
        contrato.setInmueble(inmueble);
        contrato.setInquilino(inquilino);
        contrato.setFechaInicio(fechas.fechaInicio);
        contrato.setFechaFin(fechas.fechaFin);
        contrato.setMonto(contratoDTO.getMonto());
        contrato.setPorcentajeAumento(contratoDTO.getPorcentajeAumento());
        contrato.setEstadoContrato(estadoContrato);
        contrato.setAumentaConIcl(
            contratoDTO.getAumentaConIcl() != null ? contratoDTO.getAumentaConIcl() : false
        );
        contrato.setPorcentajeHonorario(
            contratoDTO.getPorcentajeHonorario() != null 
                ? contratoDTO.getPorcentajeHonorario() 
                : new BigDecimal("10")
        );
        contrato.setPeriodoAumento(contratoDTO.getPeriodoAumento());
        contrato.setFechaAumento(fechas.fechaAumento);
        
        return contratoRepository.save(contrato);
    }

    /**
     * Actualiza los estados del inmueble e inquilino para un contrato vigente
     * 
     * Marca el inmueble como "Alquilado" y el inquilino como "Alquilando"
     * 
     * @param contrato Contrato que se está creando
     * @param inmueble Inmueble a actualizar
     * @param inquilino Inquilino a actualizar
     * @param estadoAlquilado Estado "Alquilado" pre-cargado
     */
    private void actualizarEstadosParaContratoVigente(
            Contrato contrato,
            Inmueble inmueble,
            Inquilino inquilino,
            EstadoInmueble estadoAlquilado) {
        
        // Actualizar estado del inmueble a "Alquilado"
        if (estadoAlquilado != null) {
            inmueble.setEstado(estadoAlquilado.getId());
            inmueble.setEsAlquilado(true);
            inmuebleRepository.save(inmueble);
        }
        
        // Actualizar inquilino como "Alquilando"
        inquilino.setEstaAlquilando(true);
        inquilinoRepository.save(inquilino);
    }

    /**
     * Genera el primer alquiler para un nuevo contrato vigente
     * 
     * El alquiler se genera con vencimiento el día 10 del mes actual
     * 
     * @param contrato Contrato para el cual generar el alquiler
     */
    private void generarPrimerAlquiler(Contrato contrato) {
        try {
            LocalDate fechaActual = LocalDate.now();
            LocalDate fechaVencimiento = LocalDate.of(
                fechaActual.getYear(), 
                fechaActual.getMonth(), 
                10
            );
            String fechaVencimientoISO = fechaVencimiento.format(DateTimeFormatter.ISO_LOCAL_DATE);
            
            com.alquileres.model.Alquiler nuevoAlquiler = new com.alquileres.model.Alquiler(
                contrato,
                fechaVencimientoISO,
                contrato.getMonto()
            );
            nuevoAlquiler.setEsActivo(true);
            alquilerRepository.save(nuevoAlquiler);
            
            logger.info("Alquiler generado automáticamente para el nuevo contrato ID: {} - Monto: {}",
                contrato.getId(), contrato.getMonto());
        } catch (Exception e) {
            logger.error("Error al generar alquiler para el nuevo contrato ID {}: {}",
                contrato.getId(), e.getMessage());
            // No lanzamos la excepción para no afectar la creación del contrato
        }
    }

    /**
     * Clase interna para encapsular las fechas procesadas del contrato
     */
    private static class FechasContrato {
        final String fechaInicio;
        final String fechaFin;
        final String fechaAumento;
        
        FechasContrato(String fechaInicio, String fechaFin, String fechaAumento) {
            this.fechaInicio = fechaInicio;
            this.fechaFin = fechaFin;
            this.fechaAumento = fechaAumento;
        }
    }

    /**
     * Cambia el estado de un contrato existente
     * 
     * Permite terminar, cancelar o reactivar un contrato.
     * Actualiza automáticamente los estados de inmueble, inquilino, alquileres y servicios.
     * 
     * @param id ID del contrato a modificar
     * @param estadoContratoUpdateDTO DTO con el nuevo estado y datos adicionales
     * @return ContratoDTO con el contrato actualizado
     * @throws BusinessException si el contrato no existe o el cambio no es válido
     */
    @CacheEvict(value = {"contratos", "contratos-por-vencer", "inmuebles", "inquilinos"}, allEntries = true)
    public ContratoDTO terminarContrato(Long id, EstadoContratoUpdateDTO estadoContratoUpdateDTO) {
        // Validar existencia del contrato y nuevo estado
        Contrato contrato = contratoRepository.findById(id)
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.CONTRATO_NO_ENCONTRADO, 
                "Contrato no encontrado con ID: " + id, 
                HttpStatus.NOT_FOUND
            ));
        
        EstadoContrato nuevoEstado = estadoContratoRepository.findById(
                estadoContratoUpdateDTO.getEstadoContratoId())
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.ESTADO_CONTRATO_NO_ENCONTRADO, 
                "No existe el estado de contrato indicado", 
                HttpStatus.BAD_REQUEST
            ));
        
        String estadoAnterior = contrato.getEstadoContrato().getNombre();
        String nombreNuevoEstado = nuevoEstado.getNombre();
        
        // Validar que el cambio de estado es posible
        validarCambioEstadoContrato(contrato, nombreNuevoEstado);
        
        // Actualizar el estado del contrato
        contrato.setEstadoContrato(nuevoEstado);
        
        // Aplicar los cambios según el nuevo estado
        aplicarCambiosPorNuevoEstado(
            contrato, 
            estadoAnterior, 
            nombreNuevoEstado, 
            estadoContratoUpdateDTO
        );
        
        Contrato contratoActualizado = contratoRepository.save(contrato);
        return enrichContratoDTO(contratoActualizado);
    }

    /**
     * Valida que el cambio de estado solicitado sea posible
     * 
     * @param contrato Contrato a modificar
     * @param nombreNuevoEstado Nombre del nuevo estado
     * @throws BusinessException si el cambio no es válido
     */
    private void validarCambioEstadoContrato(Contrato contrato, String nombreNuevoEstado) {
        // Si se quiere activar el contrato, validar que el inmueble esté disponible
        if ("Vigente".equals(nombreNuevoEstado)) {
            Inmueble inmueble = contrato.getInmueble();
            Optional<EstadoInmueble> estadoInmuebleActual = 
                estadoInmuebleRepository.findById(inmueble.getEstado());
            
            if (estadoInmuebleActual.isPresent() && 
                !"Disponible".equals(estadoInmuebleActual.get().getNombre())) {
                throw new BusinessException(
                    ErrorCodes.INMUEBLE_NO_DISPONIBLE,
                    "No se puede activar el contrato porque el inmueble no está disponible. " +
                    "Estado actual: " + estadoInmuebleActual.get().getNombre(),
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    /**
     * Aplica los cambios necesarios según el nuevo estado del contrato
     * 
     * @param contrato Contrato que se está modificando
     * @param estadoAnterior Nombre del estado anterior
     * @param nombreNuevoEstado Nombre del nuevo estado
     * @param estadoContratoUpdateDTO DTO con información adicional
     */
    private void aplicarCambiosPorNuevoEstado(
            Contrato contrato,
            String estadoAnterior,
            String nombreNuevoEstado,
            EstadoContratoUpdateDTO estadoContratoUpdateDTO) {
        
        if ("No Vigente".equals(nombreNuevoEstado) || "Cancelado".equals(nombreNuevoEstado)) {
            // Contrato se está terminando o cancelando
            finalizarContrato(contrato);
            
            // Si cambió de Vigente a Cancelado, crear registro de cancelación
            if ("Vigente".equals(estadoAnterior) && "Cancelado".equals(nombreNuevoEstado)) {
                crearRegistroCancelacion(contrato, estadoContratoUpdateDTO);
            }
        } else if ("Vigente".equals(nombreNuevoEstado)) {
            // Contrato se está activando/reactivando
            activarContrato(contrato);
        }
    }

    /**
     * Finaliza un contrato actualizando todos los elementos relacionados
     * 
     * - Marca el inmueble como disponible
     * - Marca el inquilino como no alquilando
     * - Anula todos los alquileres del contrato
     * - Desactiva todos los servicios del contrato
     * 
     * @param contrato Contrato a finalizar
     */
    private void finalizarContrato(Contrato contrato) {
        // Actualizar estado del inmueble a "Disponible"
        Optional<EstadoInmueble> estadoDisponible = 
            estadoInmuebleRepository.findByNombre("Disponible");
        
        if (estadoDisponible.isPresent()) {
            Inmueble inmueble = contrato.getInmueble();
            inmueble.setEstado(estadoDisponible.get().getId());
            inmueble.setEsAlquilado(false);
            inmuebleRepository.save(inmueble);
        }
        
        // Actualizar inquilino como no alquilando
        Inquilino inquilino = contrato.getInquilino();
        inquilino.setEstaAlquilando(false);
        inquilinoRepository.save(inquilino);
        
        // Anular todos los alquileres del contrato
        anularAlquileresDelContrato(contrato.getId());
        
        // Desactivar todos los servicios del contrato
        desactivarServiciosDelContrato(contrato.getId());
    }

    /**
     * Activa un contrato actualizando todos los elementos relacionados
     * 
     * - Marca el inmueble como alquilado
     * - Marca el inquilino como alquilando
     * 
     * @param contrato Contrato a activar
     */
    private void activarContrato(Contrato contrato) {
        // Actualizar estado del inmueble a "Alquilado"
        Optional<EstadoInmueble> estadoAlquilado = 
            estadoInmuebleRepository.findByNombre("Alquilado");
        
        if (estadoAlquilado.isPresent()) {
            Inmueble inmueble = contrato.getInmueble();
            inmueble.setEstado(estadoAlquilado.get().getId());
            inmueble.setEsAlquilado(true);
            inmuebleRepository.save(inmueble);
        }
        
        // Actualizar inquilino como alquilando
        Inquilino inquilino = contrato.getInquilino();
        inquilino.setEstaAlquilando(true);
        inquilinoRepository.save(inquilino);
    }

    /**
     * Crea un registro de cancelación cuando un contrato vigente se cancela
     * 
     * @param contrato Contrato que se está cancelando
     * @param estadoContratoUpdateDTO DTO con motivo y observaciones de la cancelación
     */
    private void crearRegistroCancelacion(
            Contrato contrato, 
            EstadoContratoUpdateDTO estadoContratoUpdateDTO) {
        
        // Verificar que no exista ya una cancelación
        if (cancelacionContratoRepository.existsByContratoId(contrato.getId())) {
            return;
        }
        
        // Obtener el motivo de cancelación
        MotivoCancelacion motivoCancelacion = obtenerMotivoCancelacion(
            estadoContratoUpdateDTO.getMotivoCancelacionId()
        );
        
        // Crear el registro de cancelación
        CancelacionContrato cancelacion = new CancelacionContrato();
        cancelacion.setContrato(contrato);
        cancelacion.setFechaCancelacion(
            LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );
        cancelacion.setMotivoCancelacion(motivoCancelacion);
        
        // Agregar observaciones si se proporcionaron
        if (estadoContratoUpdateDTO.getObservaciones() != null && 
            !estadoContratoUpdateDTO.getObservaciones().trim().isEmpty()) {
            cancelacion.setObservaciones(estadoContratoUpdateDTO.getObservaciones());
        }
        
        cancelacionContratoRepository.save(cancelacion);
    }

    /**
     * Obtiene el motivo de cancelación o retorna "Otro" por defecto
     * 
     * @param motivoCancelacionId ID del motivo (puede ser null)
     * @return MotivoCancelacion correspondiente
     * @throws BusinessException si el motivo especificado no existe
     */
    private MotivoCancelacion obtenerMotivoCancelacion(Integer motivoCancelacionId) {
        if (motivoCancelacionId != null) {
            return motivoCancelacionRepository.findById(motivoCancelacionId)
                .orElseThrow(() -> new BusinessException(
                    ErrorCodes.MOTIVO_CANCELACION_NO_ENCONTRADO,
                    "No existe el motivo de cancelación indicado", 
                    HttpStatus.BAD_REQUEST
                ));
        }
        
        // Si no se proporciona motivo, usar "Otro" por defecto
        return motivoCancelacionRepository.findByNombre("Otro")
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.MOTIVO_CANCELACION_NO_ENCONTRADO,
                "No se encontró el motivo de cancelación por defecto", 
                HttpStatus.INTERNAL_SERVER_ERROR
            ));
    }

    /**
     * Verifica si existe un contrato con el ID especificado
     * 
     * @param id ID del contrato a verificar
     * @return true si el contrato existe, false en caso contrario
     */
    public boolean existeContrato(Long id) {
        return contratoRepository.existsById(id);
    }

    /**
     * Verifica si un inmueble tiene un contrato vigente
     * 
     * @param inmuebleId ID del inmueble a verificar
     * @return true si el inmueble tiene un contrato vigente, false en caso contrario
     */
    public boolean inmuebleTieneContratoVigente(Long inmuebleId) {
        return contratoRepository.existsContratoVigenteByInmuebleId(inmuebleId);
    }

    /**
     * Guarda un PDF asociado a un contrato
     * 
     * @param id ID del contrato
     * @param pdfBytes Contenido del PDF en bytes
     * @param nombreArchivo Nombre del archivo PDF
     * @return ContratoDTO con el PDF guardado
     * @throws BusinessException si el contrato no existe
     */
    public ContratoDTO guardarPdf(Long id, byte[] pdfBytes, String nombreArchivo) throws Exception {
        Contrato contrato = contratoRepository.findById(id)
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "Contrato no encontrado con ID: " + id, 
                HttpStatus.NOT_FOUND
            ));
        
        // Crear y guardar el PDF
        PDF pdf = new PDF("CONTRATO", pdfBytes, nombreArchivo);
        PDF pdfGuardado = pdfService.guardarPDF(pdf.getAmbito(), pdfBytes, nombreArchivo);
        
        // Asignar el ID del PDF al contrato
        contrato.setIdPDF(pdfGuardado.getId());
        Contrato contratoActualizado = contratoRepository.save(contrato);
        
        logger.info("PDF guardado exitosamente para contrato ID: {} con PDF ID: {}", 
            id, pdfGuardado.getId());
        
        return enrichContratoDTO(contratoActualizado);
    }

    /**
     * Obtiene el PDF asociado a un contrato
     * 
     * @param id ID del contrato
     * @return Contenido del PDF en bytes
     * @throws BusinessException si el contrato no existe o no tiene PDF
     */
    public byte[] obtenerPdf(Long id) {
        Contrato contrato = contratoRepository.findById(id)
            .orElseThrow(() -> new BusinessException(
                ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "Contrato no encontrado con ID: " + id, 
                HttpStatus.NOT_FOUND
            ));
        
        Long idPDF = contrato.getIdPDF();
        if (idPDF == null) {
            throw new BusinessException(
                ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "El contrato ID " + id + " no tiene un PDF asociado", 
                HttpStatus.NOT_FOUND
            );
        }
        
        Optional<PDF> pdf = pdfService.obtenerPDF(idPDF);
        if (pdf.isEmpty()) {
            throw new BusinessException(
                ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "El PDF asociado al contrato ID " + id + " no existe", 
                HttpStatus.NOT_FOUND
            );
        }
        
        byte[] pdfBytes = pdf.get().getFile();
        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new BusinessException(
                ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "El PDF del contrato ID " + id + " está vacío", 
                HttpStatus.NOT_FOUND
            );
        }
        
        logger.info("PDF obtenido para contrato ID: {}", id);
        return pdfBytes;
    }

    /**
     * Anula todos los alquileres asociados a un contrato (borrado lógico)
     * 
     * Se llama cuando el contrato cambia a estado "No Vigente" o "Cancelado"
     * Los alquileres no se eliminan físicamente, solo se marcan como inactivos
     * 
     * @param contratoId ID del contrato cuyos alquileres serán anulados
     * @throws BusinessException si hay un error al desactivar los alquileres
     */
    private void anularAlquileresDelContrato(Long contratoId) {
        try {
            // Buscar TODOS los alquileres del contrato (activos e inactivos)
            List<com.alquileres.model.Alquiler> alquileres =
                alquilerRepository.findAllByContratoId(contratoId);

            if (alquileres != null && !alquileres.isEmpty()) {
                // Marcar todos los alquileres como inactivos (borrado lógico)
                int alquileresDesactivados = 0;
                for (com.alquileres.model.Alquiler alquiler : alquileres) {
                    if (alquiler.getEsActivo()) {
                        alquiler.setEsActivo(false);
                        alquileresDesactivados++;
                    }
                }

                if (alquileresDesactivados > 0) {
                    alquilerRepository.saveAll(alquileres);
                    logger.info("Se anularon {} alquileres del contrato ID: {} (borrado lógico)",
                        alquileresDesactivados, contratoId);
                } else {
                    logger.info("Todos los alquileres del contrato ID: {} ya estaban inactivos", contratoId);
                }
            } else {
                logger.info("No hay alquileres para anular en el contrato ID: {}", contratoId);
            }
        } catch (Exception e) {
            logger.error("Error al desactivar alquileres del contrato ID: {}", contratoId, e);
            throw new BusinessException(
                ErrorCodes.ERROR_INTERNO,
                "Error al desactivar los alquileres del contrato",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Desactiva todos los servicios activos asociados a un contrato
     * 
     * Se llama cuando el contrato cambia a estado "No Vigente" o "Cancelado"
     * 
     * @param contratoId ID del contrato cuyos servicios serán desactivados
     * @throws BusinessException si hay un error al desactivar los servicios
     */
    private void desactivarServiciosDelContrato(Long contratoId) {
        try {
            List<com.alquileres.model.ServicioContrato> servicios =
                servicioContratoService.getServiciosActivosByContrato(contratoId);

            if (servicios != null && !servicios.isEmpty()) {
                // Desactivar todos los servicios
                for (com.alquileres.model.ServicioContrato servicio : servicios) {
                    servicioContratoService.desactivarServicio(servicio.getId());
                }
                
                logger.info("Se desactivaron {} servicios del contrato ID: {}", 
                    servicios.size(), contratoId);
            } else {
                logger.info("No hay servicios activos para desactivar en el contrato ID: {}", 
                    contratoId);
            }
        } catch (Exception e) {
            logger.error("Error al desactivar servicios del contrato ID: {}", contratoId, e);
            throw new BusinessException(
                ErrorCodes.ERROR_INTERNO,
                "Error al desactivar los servicios del contrato", 
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Crea alquileres retroactivos para un contrato con fecha de inicio en el pasado
     * 
     * Genera un alquiler por cada mes desde la fecha de inicio hasta el mes anterior al actual.
     * Aplica aumentos según el periodoAumento configurado y el tipo de aumento (ICL o porcentaje fijo).
     * Marca todos los alquileres retroactivos como pagados.
     * 
     * @param contrato Contrato para el cual crear los alquileres retroactivos
     * @param fechaInicio Fecha de inicio del contrato (en el pasado)
     * @param fechaActual Fecha actual
     */

    private void crearAlquileresRetroactivos(Contrato contrato, LocalDate fechaInicio, LocalDate fechaActual) {
        try {
            logger.info("Iniciando creación de alquileres retroactivos para contrato ID: {}", contrato.getId());
            
            List<Alquiler> alquileresRetroactivos = new java.util.ArrayList<>();
            List<AumentoAlquiler> aumentosRetroactivos = new java.util.ArrayList<>();
            
            // Variables para el control de aumentos
            BigDecimal montoActual = contrato.getMonto();
            LocalDate fechaProximoAumento = calcularFechaProximoAumento(fechaInicio, contrato.getPeriodoAumento());
            LocalDate fechaUltimoAumento = fechaInicio.withDayOfMonth(1); // Rastrear la fecha del último aumento aplicado

            // Crear el primer alquiler con la fecha de inicio del contrato (día original)
            LocalDate fechaVencimientoPrimerAlquiler = fechaInicio.withDayOfMonth(10);
            String fechaVencimientoISO = fechaVencimientoPrimerAlquiler.format(DateTimeFormatter.ISO_LOCAL_DATE);

            // Calcular el mes actual
            int mesActual = fechaActual.getMonthValue();
            int anioActual = fechaActual.getYear();

            Alquiler primerAlquiler = new Alquiler(
                contrato, fechaVencimientoISO, montoActual
            );

            // Determinar si el primer alquiler es del mes actual
            boolean primerAlquilerEsMesActual = (fechaInicio.getMonthValue() == mesActual &&
                                                fechaInicio.getYear() == anioActual);

            if (primerAlquilerEsMesActual) {
                // Si es del mes actual, NO está pagado
                primerAlquiler.setEstaPagado(false);
                primerAlquiler.setFechaPago(null);
                logger.debug("Primer alquiler del MES ACTUAL creado (NO pagado): fecha={}, monto={}",
                            fechaVencimientoISO, montoActual);
            } else {
                // Si es de un mes anterior, está pagado
                primerAlquiler.setEstaPagado(true);
                primerAlquiler.setFechaPago(fechaVencimientoISO);
                logger.debug("Primer alquiler retroactivo creado (pagado): fecha={}, monto={}",
                            fechaVencimientoISO, montoActual);
            }

            primerAlquiler.setEsActivo(true);
            alquileresRetroactivos.add(primerAlquiler);

            // Iniciar desde el mes siguiente a la fecha de inicio
            LocalDate mesIteracion = fechaInicio.plusMonths(1).withDayOfMonth(1);

            // Crear alquileres para cada mes hasta el mes actual (inclusive)
            while (mesIteracion.getMonthValue() <= mesActual && mesIteracion.getYear() <= anioActual) {
                // Verificar si debe aplicar aumento en este mes
                if (fechaProximoAumento != null && 
                    (mesIteracion.getMonthValue() == fechaProximoAumento.getMonthValue() &&
                     mesIteracion.getYear() == fechaProximoAumento.getYear())) {

                    BigDecimal montoAnterior = montoActual;
                    LocalDate fechaSiguienteAumento = fechaProximoAumento.withDayOfMonth(1);

                    // Aplicar aumento según el tipo configurado
                    if (Boolean.TRUE.equals(contrato.getAumentaConIcl())) {
                        // Aumento por ICL: usar fechaUltimoAumento y fechaSiguienteAumento
                        montoActual = aplicarAumentoICL(contrato, montoAnterior, fechaUltimoAumento, fechaSiguienteAumento, aumentosRetroactivos);
                    } else {
                        // Aumento por porcentaje fijo
                        montoActual = aplicarAumentoFijo(contrato, montoAnterior, mesIteracion, aumentosRetroactivos);
                    }
                    
                    // Actualizar la fecha del último aumento
                    fechaUltimoAumento = fechaSiguienteAumento;

                    // Calcular la siguiente fecha de aumento
                    fechaProximoAumento = calcularFechaProximoAumento(fechaProximoAumento, contrato.getPeriodoAumento());
                    
                    logger.debug("Aumento aplicado en mes {}/{}: monto anterior={}, monto nuevo={}",
                                mesIteracion.getMonthValue(), mesIteracion.getYear(), montoAnterior, montoActual);
                }
                
                // Crear alquiler para este mes con fecha de vencimiento día 10
                LocalDate fechaVencimiento = mesIteracion.withDayOfMonth(10);
                fechaVencimientoISO = fechaVencimiento.format(DateTimeFormatter.ISO_LOCAL_DATE);

                Alquiler alquiler = new Alquiler(
                    contrato, fechaVencimientoISO, montoActual
                );

                // Determinar si es el mes actual para marcarlo como NO pagado
                boolean esMesActual = (mesIteracion.getMonthValue() == mesActual &&
                                      mesIteracion.getYear() == anioActual);

                if (esMesActual) {
                    // Alquiler del mes actual: NO está pagado
                    alquiler.setEstaPagado(false);
                    alquiler.setFechaPago(null);
                    logger.debug("Alquiler del MES ACTUAL creado (NO pagado): fecha={}, monto={}",
                                fechaVencimientoISO, montoActual);
                } else {
                    // Alquiler de meses anteriores: está pagado
                    alquiler.setEstaPagado(true);
                    alquiler.setFechaPago(fechaVencimientoISO);
                    logger.debug("Alquiler retroactivo creado (pagado): fecha={}, monto={}",
                                fechaVencimientoISO, montoActual);
                }

                alquiler.setEsActivo(true);
                alquileresRetroactivos.add(alquiler);


                // Avanzar al siguiente mes
                mesIteracion = mesIteracion.plusMonths(1);
            }
            
            // Guardar todos los alquileres retroactivos
            if (!alquileresRetroactivos.isEmpty()) {
                alquilerRepository.saveAll(alquileresRetroactivos);
                logger.info("Guardados {} alquileres retroactivos para contrato ID: {}", 
                           alquileresRetroactivos.size(), contrato.getId());
            }
            
            // Guardar todos los aumentos retroactivos
            if (!aumentosRetroactivos.isEmpty()) {
                aumentoAlquilerService.guardarAumentosEnBatch(aumentosRetroactivos);
                logger.info("Guardados {} aumentos retroactivos para contrato ID: {}", 
                           aumentosRetroactivos.size(), contrato.getId());
            }
            
            // Actualizar la fechaAumento del contrato para reflejar el próximo aumento
            if (fechaProximoAumento != null) {
                String nuevaFechaAumento = fechaProximoAumento.format(DateTimeFormatter.ISO_LOCAL_DATE);
                
                // Verificar que no supere la fecha de fin del contrato
                if (contrato.getFechaFin() != null && !contrato.getFechaFin().isEmpty()) {
                    LocalDate fechaFin = LocalDate.parse(contrato.getFechaFin(), DateTimeFormatter.ISO_LOCAL_DATE);
                    if (fechaProximoAumento.isAfter(fechaFin)) {
                        nuevaFechaAumento = "No aumenta más";
                    }
                }
                
                contrato.setFechaAumento(nuevaFechaAumento);
                contratoRepository.save(contrato);
                logger.info("FechaAumento del contrato ID {} actualizada a: {}", 
                           contrato.getId(), nuevaFechaAumento);
            }
            
        } catch (Exception e) {
            logger.error("Error al crear alquileres retroactivos para contrato ID {}: {}", 
                        contrato.getId(), e.getMessage(), e);
            throw new BusinessException(
                ErrorCodes.ERROR_INTERNO,
                "Error al generar alquileres retroactivos: " + e.getMessage(),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    
    /**
     * Calcula la fecha del próximo aumento basado en una fecha base y el período de aumento
     * 
     * @param fechaBase Fecha base desde la cual calcular
     * @param periodoAumento Período de aumento en meses
     * @return Fecha del próximo aumento, o null si no hay período configurado
     */
    private LocalDate calcularFechaProximoAumento(LocalDate fechaBase, Integer periodoAumento) {
        if (periodoAumento == null || periodoAumento <= 0) {
            return null;
        }
        return fechaBase.plusMonths(periodoAumento);
    }
    
    /**
     * Aplica un aumento basado en ICL consultando la API del BCRA
     * 
     * @param contrato Contrato al que se aplica el aumento
     * @param montoAnterior Monto antes del aumento
     * @param fechaUltimoAumento Fecha del último aumento
     * @param fechaSiguienteAumento Fecha del siguiente aumento
     * @param aumentosRetroactivos Lista donde se agregan los aumentos creados
     * @return Nuevo monto con el aumento aplicado
     */
    private BigDecimal aplicarAumentoICL(Contrato contrato, BigDecimal montoAnterior, 
                                          LocalDate fechaUltimoAumento, LocalDate fechaSiguienteAumento,
                                          List<AumentoAlquiler> aumentosRetroactivos) {
        try {
            // Formatear fechas para consulta a la API
            String fechaInicioISO = fechaUltimoAumento.withDayOfMonth(1).format(DateTimeFormatter.ISO_LOCAL_DATE);
            String fechaFinISO = fechaSiguienteAumento.withDayOfMonth(1).format(DateTimeFormatter.ISO_LOCAL_DATE);
            
            logger.debug("Consultando ICL del BCRA para aumento retroactivo: desde {} hasta {}", 
                        fechaInicioISO, fechaFinISO);
            
            // Consultar tasa de aumento del BCRA
            BigDecimal tasaAumento = bcraApiClient.obtenerTasaAumentoICL(fechaInicioISO, fechaFinISO);
            BigDecimal montoNuevo = montoAnterior.multiply(tasaAumento).setScale(2, RoundingMode.HALF_UP);
            
            // Calcular porcentaje de aumento
            BigDecimal porcentajeAumento = tasaAumento.subtract(BigDecimal.ONE)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);
            
            // Crear registro de aumento
            AumentoAlquiler aumento = 
                aumentoAlquilerService.crearAumentoSinGuardar(
                    contrato, montoAnterior, montoNuevo, porcentajeAumento
                );
            aumento.setFechaAumento(fechaSiguienteAumento.format(DateTimeFormatter.ISO_LOCAL_DATE));
            aumento.setDescripcion("Aumento retroactivo por ICL");
            aumentosRetroactivos.add(aumento);
            
            logger.info("Aumento ICL retroactivo calculado: monto anterior={}, monto nuevo={}, tasa={}", 
                       montoAnterior, montoNuevo, tasaAumento);
            
            return montoNuevo;
            
        } catch (Exception e) {
            logger.error("Error al consultar ICL para aumento retroactivo: {}. Se usará el monto sin aumento.", 
                        e.getMessage());
            // Si falla la API, retornar el monto anterior sin aumento
            return montoAnterior;
        }
    }
    
    /**
     * Aplica un aumento basado en porcentaje fijo
     * 
     * @param contrato Contrato al que se aplica el aumento
     * @param montoAnterior Monto antes del aumento
     * @param fechaAumento Fecha del aumento
     * @param aumentosRetroactivos Lista donde se agregan los aumentos creados
     * @return Nuevo monto con el aumento aplicado
     */
    private BigDecimal aplicarAumentoFijo(Contrato contrato, BigDecimal montoAnterior, 
                                           LocalDate fechaAumento,
                                           List<AumentoAlquiler> aumentosRetroactivos) {
        BigDecimal porcentajeAumento = contrato.getPorcentajeAumento() != null 
            ? contrato.getPorcentajeAumento() 
            : BigDecimal.ZERO;
        
        // Calcular tasa de aumento: 1 + (porcentaje / 100)
        BigDecimal tasaAumento = BigDecimal.ONE.add(
            porcentajeAumento.divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP)
        );
        
        BigDecimal montoNuevo = montoAnterior.multiply(tasaAumento).setScale(2, RoundingMode.HALF_UP);
        
        // Crear registro de aumento
        AumentoAlquiler aumento = 
            aumentoAlquilerService.crearAumentoSinGuardar(
                contrato, montoAnterior, montoNuevo, porcentajeAumento
            );
        aumento.setFechaAumento(fechaAumento.format(DateTimeFormatter.ISO_LOCAL_DATE));
        aumento.setDescripcion("Aumento retroactivo por porcentaje fijo");
        aumentosRetroactivos.add(aumento);
        
        logger.info("Aumento fijo retroactivo calculado: monto anterior={}, monto nuevo={}, porcentaje={}%", 
                   montoAnterior, montoNuevo, porcentajeAumento);
        
        return montoNuevo;
    }
}
