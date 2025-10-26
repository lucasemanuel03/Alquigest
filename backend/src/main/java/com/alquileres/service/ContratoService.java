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
import com.alquileres.security.EncryptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ContratoService {

    private static final Logger logger = LoggerFactory.getLogger(ContratoService.class);

    @Autowired
    private ContratoRepository contratoRepository;

    @Autowired
    private InmuebleRepository inmuebleRepository;

    @Autowired
    private InquilinoRepository inquilinoRepository;

    @Autowired
    private EstadoContratoRepository estadoContratoRepository;

    @Autowired
    private EstadoInmuebleRepository estadoInmuebleRepository;

    @Autowired
    private PropietarioRepository propietarioRepository;

    @Autowired
    private TipoInmuebleRepository tipoInmuebleRepository;

    @Autowired
    private CancelacionContratoRepository cancelacionContratoRepository;

    @Autowired
    private MotivoCancelacionRepository motivoCancelacionRepository;

    @Autowired
    private AlquilerRepository alquilerRepository;

    @Autowired
    private AlquilerActualizacionService alquilerActualizacionService;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private PDFService pdfService;

    // Método helper para enriquecer ContratoDTO con información del propietario
    private ContratoDTO enrichContratoDTO(Contrato contrato) {
        ContratoDTO contratoDTO = new ContratoDTO(contrato);

        // Convertir fechas de formato ISO a formato de usuario para la respuesta
        if (contrato.getFechaInicio() != null) {
            contratoDTO.setFechaInicio(FechaUtil.convertirFechaISOToUsuario(contrato.getFechaInicio()));
        }
        if (contrato.getFechaFin() != null) {
            contratoDTO.setFechaFin(FechaUtil.convertirFechaISOToUsuario(contrato.getFechaFin()));
        }
        if (contrato.getFechaAumento() != null) {
            contratoDTO.setFechaAumento(FechaUtil.convertirFechaISOToUsuario(contrato.getFechaAumento()));
        }

        // Obtener información completa del propietario a través del inmueble
        if (contrato.getInmueble() != null && contrato.getInmueble().getPropietarioId() != null) {
            Optional<Propietario> propietario = propietarioRepository.findById(contrato.getInmueble().getPropietarioId());
            if (propietario.isPresent()) {
                Propietario prop = propietario.get();
                contratoDTO.setNombrePropietario(prop.getNombre());
                contratoDTO.setApellidoPropietario(prop.getApellido());
                contratoDTO.setDniPropietario(prop.getCuil());
                contratoDTO.setTelefonoPropietario(prop.getTelefono());
                contratoDTO.setEmailPropietario(prop.getEmail());
                contratoDTO.setDireccionPropietario(prop.getDireccion());

                // Desencriptar clave fiscal
                if (prop.getClaveFiscal() != null && !prop.getClaveFiscal().trim().isEmpty()) {
                    try {
                        contratoDTO.setClaveFiscalPropietario(encryptionService.desencriptar(prop.getClaveFiscal()));
                    } catch (Exception e) {
                        logger.error("Error desencriptando clave fiscal del propietario", e);
                        contratoDTO.setClaveFiscalPropietario(null);
                    }
                }
            }
        }

        // Obtener información del tipo de inmueble
        if (contrato.getInmueble() != null && contrato.getInmueble().getTipoInmuebleId() != null) {
            Optional<TipoInmueble> tipoInmueble = tipoInmuebleRepository.findById(contrato.getInmueble().getTipoInmuebleId());
            if (tipoInmueble.isPresent()) {
                contratoDTO.setTipoInmueble(tipoInmueble.get().getNombre());
            }
        }

        // Obtener el monto del último alquiler
        Optional<com.alquileres.model.Alquiler> ultimoAlquiler = alquilerRepository.findUltimoAlquilerByContratoId(contrato.getId());
        if (ultimoAlquiler.isPresent()) {
            contratoDTO.setMontoUltimoAlquiler(ultimoAlquiler.get().getMonto());
        }

        return contratoDTO;
    }

    // Obtener todos los contratos
    public List<ContratoDTO> obtenerTodosLosContratos() {
        List<Contrato> contratos = contratoRepository.findAll();
        return contratos.stream()
                .map(this::enrichContratoDTO)
                .collect(Collectors.toList());
    }

    // Obtener contrato por ID
    public ContratoDTO obtenerContratoPorId(Long id) {
        Optional<Contrato> contrato = contratoRepository.findById(id);
        if (contrato.isPresent()) {
            return enrichContratoDTO(contrato.get());
        } else {
            throw new BusinessException(ErrorCodes.CONTRATO_NO_ENCONTRADO, "Contrato no encontrado con ID: " + id, HttpStatus.NOT_FOUND);
        }
    }

    // Obtener contratos por inmueble
    public List<ContratoDTO> obtenerContratosPorInmueble(Long inmuebleId) {
        Optional<Inmueble> inmueble = inmuebleRepository.findById(inmuebleId);
        if (!inmueble.isPresent()) {
            throw new BusinessException(ErrorCodes.INMUEBLE_NO_ENCONTRADO, "Inmueble no encontrado con ID: " + inmuebleId, HttpStatus.NOT_FOUND);
        }

        List<Contrato> contratos = contratoRepository.findByInmueble(inmueble.get());
        return contratos.stream()
                .map(this::enrichContratoDTO)
                .collect(Collectors.toList());
    }

    // Obtener contratos por inquilino
    public List<ContratoDTO> obtenerContratosPorInquilino(Long inquilinoId) {
        Optional<Inquilino> inquilino = inquilinoRepository.findById(inquilinoId);
        if (!inquilino.isPresent()) {
            throw new BusinessException(ErrorCodes.INQUILINO_NO_ENCONTRADO, "Inquilino no encontrado con ID: " + inquilinoId, HttpStatus.NOT_FOUND);
        }

        List<Contrato> contratos = contratoRepository.findByInquilino(inquilino.get());
        return contratos.stream()
                .map(this::enrichContratoDTO)
                .collect(Collectors.toList());
    }

    // Obtener contratos vigentes
    public List<ContratoDTO> obtenerContratosVigentes() {
        List<Contrato> contratos = contratoRepository.findContratosVigentes();
        return contratos.stream()
                .map(this::enrichContratoDTO)
                .collect(Collectors.toList());
    }

    // Obtener contratos no vigentes
    public List<ContratoDTO> obtenerContratosNoVigentes() {
        List<Contrato> contratos = contratoRepository.findContratosNoVigentes();
        return contratos.stream()
                .map(this::enrichContratoDTO)
                .collect(Collectors.toList());
    }

    // Contar contratos vigentes
    public Long contarContratosVigentes() {
        return contratoRepository.countContratosVigentes();
    }

    // Obtener contratos que vencen próximamente
    public List<ContratoDTO> obtenerContratosProximosAVencer(int diasAntes) {
        // Calcular fecha actual y fecha límite como strings en formato ISO
        String fechaActual = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String fechaLimite = LocalDate.now().plusDays(diasAntes).format(DateTimeFormatter.ISO_LOCAL_DATE);
        List<Contrato> contratos = contratoRepository.findContratosVigentesProximosAVencer(fechaActual, fechaLimite);
        return contratos.stream()
                .map(this::enrichContratoDTO)
                .collect(Collectors.toList());
    }

    // Contar contratos próximos a vencer
    public Long contarContratosProximosAVencer(int diasAntes) {
        // Calcular fecha actual y fecha límite como strings en formato ISO
        String fechaActual = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String fechaLimite = LocalDate.now().plusDays(diasAntes).format(DateTimeFormatter.ISO_LOCAL_DATE);
        return contratoRepository.countContratosVigentesProximosAVencer(fechaActual, fechaLimite);
    }

    // Crear nuevo contrato
    public ContratoDTO crearContrato(ContratoCreateDTO contratoDTO) {
        // Validar que existe el inmueble
        Optional<Inmueble> inmueble = inmuebleRepository.findById(contratoDTO.getInmuebleId());
        if (!inmueble.isPresent()) {
            throw new BusinessException(ErrorCodes.INMUEBLE_NO_ENCONTRADO, "No existe el inmueble indicado", HttpStatus.BAD_REQUEST);
        }

        // Validar que existe el inquilino
        Optional<Inquilino> inquilino = inquilinoRepository.findById(contratoDTO.getInquilinoId());
        if (!inquilino.isPresent()) {
            throw new BusinessException(ErrorCodes.INQUILINO_NO_ENCONTRADO, "No existe el inquilino indicado", HttpStatus.BAD_REQUEST);
        }

        // Validar o asignar estado de contrato
        EstadoContrato estadoContrato;
        if (contratoDTO.getEstadoContratoId() != null) {
            // Si se proporciona un estado, validar que existe
            Optional<EstadoContrato> estadoContratoOpt = estadoContratoRepository.findById(contratoDTO.getEstadoContratoId());
            if (!estadoContratoOpt.isPresent()) {
                throw new BusinessException(ErrorCodes.ESTADO_CONTRATO_NO_ENCONTRADO, "No existe el estado de contrato indicado", HttpStatus.BAD_REQUEST);
            }
            estadoContrato = estadoContratoOpt.get();
        } else {
            // Si no se proporciona estado, asignar "Vigente" por defecto
            Optional<EstadoContrato> estadoVigenteOpt = estadoContratoRepository.findByNombre("Vigente");
            if (!estadoVigenteOpt.isPresent()) {
                throw new BusinessException(ErrorCodes.ESTADO_CONTRATO_NO_ENCONTRADO, "No se pudo asignar el estado por defecto", HttpStatus.INTERNAL_SERVER_ERROR);
            }
            estadoContrato = estadoVigenteOpt.get();
        }

        // Validar que el inmueble no tenga un contrato vigente
        if (contratoRepository.existsContratoVigenteByInmueble(inmueble.get())) {
            throw new BusinessException(ErrorCodes.INMUEBLE_YA_ALQUILADO, "El inmueble ya tiene un contrato vigente", HttpStatus.BAD_REQUEST);
        }

        // Validar y convertir fechas del formato del usuario (dd/MM/yyyy) al formato ISO (yyyy-MM-dd)
        String fechaInicioISO = null;
        String fechaFinISO = null;

        try {
            if (contratoDTO.getFechaInicio() != null) {
                if (!FechaUtil.esFechaValidaUsuario(contratoDTO.getFechaInicio())) {
                    throw new BusinessException(ErrorCodes.FORMATO_FECHA_INVALIDO,
                        "Formato de fecha de inicio inválido. Use dd/MM/yyyy (ej: 25/12/2024)", HttpStatus.BAD_REQUEST);
                }
                fechaInicioISO = FechaUtil.convertirFechaUsuarioToISO(contratoDTO.getFechaInicio());
            }

            if (contratoDTO.getFechaFin() != null) {
                if (!FechaUtil.esFechaValidaUsuario(contratoDTO.getFechaFin())) {
                    throw new BusinessException(ErrorCodes.FORMATO_FECHA_INVALIDO,
                        "Formato de fecha de fin inválido. Use dd/MM/yyyy (ej: 25/12/2024)", HttpStatus.BAD_REQUEST);
                }
                fechaFinISO = FechaUtil.convertirFechaUsuarioToISO(contratoDTO.getFechaFin());
            }
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCodes.FORMATO_FECHA_INVALIDO, e.getMessage(), HttpStatus.BAD_REQUEST);
        }

        // Validar fechas lógicas usando las fechas convertidas
        String fechaActualISO = LocalDate.now().toString(); // Formato yyyy-MM-dd

        if (fechaInicioISO != null && fechaFinISO != null) {
            if (FechaUtil.compararFechas(fechaFinISO, fechaInicioISO) < 0) {
                throw new BusinessException(ErrorCodes.RANGO_DE_FECHAS_INVALIDO, "La fecha de fin no puede ser anterior a la fecha de inicio", HttpStatus.BAD_REQUEST);
            }
        }

        // Validar que la fecha de fin no sea anterior a la fecha actual
        if (fechaFinISO != null) {
            if (FechaUtil.compararFechas(fechaFinISO, fechaActualISO) < 0) {
                throw new BusinessException(ErrorCodes.RANGO_DE_FECHAS_INVALIDO,
                    "La fecha de fin no puede ser anterior a la fecha actual", HttpStatus.BAD_REQUEST);
            }
        }

        // Calcular fecha de aumento usando las fechas en formato ISO
        String fechaAumentoCalculada = null;
        if (fechaInicioISO != null && contratoDTO.getPeriodoAumento() != null && contratoDTO.getPeriodoAumento() > 0) {
            try {
                fechaAumentoCalculada = FechaUtil.agregarMeses(fechaInicioISO, contratoDTO.getPeriodoAumento());

                // Validar que la fechaAumento no sea mayor a la fechaFin
                if (fechaFinISO != null && FechaUtil.compararFechas(fechaAumentoCalculada, fechaFinISO) > 0) {
                    fechaAumentoCalculada = "No aumenta más";
                }
            } catch (IllegalArgumentException e) {
                throw new BusinessException(ErrorCodes.ERROR_CALCULO_FECHA, "Error calculando fecha de aumento: " + e.getMessage(), HttpStatus.BAD_REQUEST);
            }
        }

        // Crear el contrato con las fechas en formato ISO
        Contrato contrato = new Contrato();
        contrato.setInmueble(inmueble.get());
        contrato.setInquilino(inquilino.get());
        contrato.setFechaInicio(fechaInicioISO);
        contrato.setFechaFin(fechaFinISO);
        contrato.setMonto(contratoDTO.getMonto());
        contrato.setPorcentajeAumento(contratoDTO.getPorcentajeAumento());
        contrato.setEstadoContrato(estadoContrato);
        contrato.setAumentaConIcl(contratoDTO.getAumentaConIcl() != null ? contratoDTO.getAumentaConIcl() : false);
        contrato.setPeriodoAumento(contratoDTO.getPeriodoAumento());
        contrato.setFechaAumento(fechaAumentoCalculada);

        // Guardar el contrato
        Contrato contratoGuardado = contratoRepository.save(contrato);

        // Actualizar el estado del inmueble a "Alquilado"
        Optional<EstadoInmueble> estadoAlquilado = estadoInmuebleRepository.findByNombre("Alquilado");
        if (estadoAlquilado.isPresent()) {
            Inmueble inmuebleToUpdate = inmueble.get();
            inmuebleToUpdate.setEstado(estadoAlquilado.get().getId());
            inmuebleToUpdate.setEsAlquilado(true);
            inmuebleRepository.save(inmuebleToUpdate);
        }

        // Actualizar estaAlquilando del inquilino si el contrato es Vigente
        if ("Vigente".equals(estadoContrato.getNombre())) {
            Inquilino inquilinoToUpdate = inquilino.get();
            inquilinoToUpdate.setEstaAlquilando(true);
            inquilinoRepository.save(inquilinoToUpdate);

            // Forzar la creación del alquiler para el nuevo contrato
            try {
                boolean alquilerGenerado = alquilerActualizacionService.generarAlquilerParaNuevoContrato(contratoGuardado.getId());
                if (alquilerGenerado) {
                    logger.info("Alquiler generado automáticamente para el nuevo contrato ID: {}", contratoGuardado.getId());
                }
            } catch (Exception e) {
                logger.error("Error al generar alquiler para el nuevo contrato ID {}: {}",
                           contratoGuardado.getId(), e.getMessage());
                // No lanzamos la excepción para no afectar la creación del contrato
            }
        }

        return enrichContratoDTO(contratoGuardado);
    }


    // Cambiar estado del contrato
    public ContratoDTO terminarContrato(Long id, EstadoContratoUpdateDTO estadoContratoUpdateDTO) {
        // Verificar que existe el contrato
        Optional<Contrato> contratoExistente = contratoRepository.findById(id);
        if (!contratoExistente.isPresent()) {
            throw new BusinessException(ErrorCodes.CONTRATO_NO_ENCONTRADO, "Contrato no encontrado con ID: " + id, HttpStatus.NOT_FOUND);
        }

        // Verificar que existe el estado de contrato
        Optional<EstadoContrato> estadoContrato = estadoContratoRepository.findById(estadoContratoUpdateDTO.getEstadoContratoId());
        if (!estadoContrato.isPresent()) {
            throw new BusinessException(ErrorCodes.ESTADO_CONTRATO_NO_ENCONTRADO, "No existe el estado de contrato indicado", HttpStatus.BAD_REQUEST);
        }

        Contrato contrato = contratoExistente.get();
        String estadoAnterior = contrato.getEstadoContrato().getNombre();
        String nombreEstadoContrato = estadoContrato.get().getNombre();

        // Validar que el inmueble esté disponible si se quiere cambiar a un estado que no sea terminar
        if ("Vigente".equals(nombreEstadoContrato)) {
            // Si se quiere poner el contrato como "Vigente", validar que el inmueble esté disponible
            Inmueble inmueble = contrato.getInmueble();
            Optional<EstadoInmueble> estadoInmuebleActual = estadoInmuebleRepository.findById(inmueble.getEstado());

            if (estadoInmuebleActual.isPresent() && !"Disponible".equals(estadoInmuebleActual.get().getNombre())) {
                throw new BusinessException(ErrorCodes.INMUEBLE_NO_DISPONIBLE,
                    "No se puede activar el contrato porque el inmueble no está disponible. Estado actual: " + estadoInmuebleActual.get().getNombre(),
                    HttpStatus.BAD_REQUEST);
            }
        }

        // Actualizar el estado del contrato
        contrato.setEstadoContrato(estadoContrato.get());

        // Verificar si el nuevo estado requiere actualizar el inmueble
        if ("No Vigente".equals(nombreEstadoContrato) || "Cancelado".equals(nombreEstadoContrato)) {
            // Actualizar el estado del inmueble a "Disponible"
            Optional<EstadoInmueble> estadoDisponible = estadoInmuebleRepository.findByNombre("Disponible");
            if (estadoDisponible.isPresent()) {
                Inmueble inmuebleToUpdate = contrato.getInmueble();
                inmuebleToUpdate.setEstado(estadoDisponible.get().getId());
                inmuebleToUpdate.setEsAlquilado(false);
                inmuebleRepository.save(inmuebleToUpdate);
            }

            // Actualizar estaAlquilando del inquilino a false
            Inquilino inquilinoToUpdate = contrato.getInquilino();
            inquilinoToUpdate.setEstaAlquilando(false);
            inquilinoRepository.save(inquilinoToUpdate);

            // ANULAR TODOS LOS ALQUILERES DEL CONTRATO
            anularAlquileresDelContrato(id);
        } else if ("Vigente".equals(nombreEstadoContrato)) {
            // Actualizar el estado del inmueble a "Alquilado"
            Optional<EstadoInmueble> estadoAlquilado = estadoInmuebleRepository.findByNombre("Alquilado");
            if (estadoAlquilado.isPresent()) {
                Inmueble inmuebleToUpdate = contrato.getInmueble();
                inmuebleToUpdate.setEstado(estadoAlquilado.get().getId());
                inmuebleToUpdate.setEsAlquilado(true);
                inmuebleRepository.save(inmuebleToUpdate);
            }

            // Actualizar estaAlquilando del inquilino a true
            Inquilino inquilinoToUpdate = contrato.getInquilino();
            inquilinoToUpdate.setEstaAlquilando(true);
            inquilinoRepository.save(inquilinoToUpdate);
        }

        // Si se está cambiando de "Vigente" a "Cancelado", crear registro de cancelación
        if ("Vigente".equals(estadoAnterior) && "Cancelado".equals(nombreEstadoContrato)) {
            // Verificar que no exista ya una cancelación para este contrato
            if (!cancelacionContratoRepository.existsByContratoId(id)) {
                // Obtener el motivo de cancelación
                MotivoCancelacion motivoCancelacion;
                if (estadoContratoUpdateDTO.getMotivoCancelacionId() != null) {
                    // Si se proporciona un motivo, buscarlo
                    Optional<MotivoCancelacion> motivoOpt = motivoCancelacionRepository.findById(estadoContratoUpdateDTO.getMotivoCancelacionId());
                    if (!motivoOpt.isPresent()) {
                        throw new BusinessException(ErrorCodes.MOTIVO_CANCELACION_NO_ENCONTRADO,
                            "No existe el motivo de cancelación indicado", HttpStatus.BAD_REQUEST);
                    }
                    motivoCancelacion = motivoOpt.get();
                } else {
                    // Si no se proporciona motivo, usar "Otro" por defecto
                    Optional<MotivoCancelacion> motivoOtroOpt = motivoCancelacionRepository.findByNombre("Otro");
                    if (!motivoOtroOpt.isPresent()) {
                        throw new BusinessException(ErrorCodes.MOTIVO_CANCELACION_NO_ENCONTRADO,
                            "No se encontró el motivo de cancelación por defecto", HttpStatus.INTERNAL_SERVER_ERROR);
                    }
                    motivoCancelacion = motivoOtroOpt.get();
                }

                // Crear el objeto de cancelación
                CancelacionContrato cancelacion = new CancelacionContrato();
                cancelacion.setContrato(contrato);
                cancelacion.setFechaCancelacion(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                cancelacion.setMotivoCancelacion(motivoCancelacion);

                // Agregar observaciones si se proporcionaron
                if (estadoContratoUpdateDTO.getObservaciones() != null && !estadoContratoUpdateDTO.getObservaciones().trim().isEmpty()) {
                    cancelacion.setObservaciones(estadoContratoUpdateDTO.getObservaciones());
                }

                // Guardar la cancelación
                cancelacionContratoRepository.save(cancelacion);
            }
        }

        Contrato contratoActualizado = contratoRepository.save(contrato);
        return enrichContratoDTO(contratoActualizado);
    }

    // Verificar si existe un contrato
    public boolean existeContrato(Long id) {
        return contratoRepository.existsById(id);
    }

    // Verificar si un inmueble tiene un contrato vigente
    public boolean inmuebleTieneContratoVigente(Long inmuebleId) {
        return contratoRepository.existsContratoVigenteByInmuebleId(inmuebleId);
    }

    // Guardar PDF en un contrato
    public ContratoDTO guardarPdf(Long id, byte[] pdfBytes, String nombreArchivo) throws Exception {
        Optional<Contrato> contrato = contratoRepository.findById(id);
        if (!contrato.isPresent()) {
            throw new BusinessException(ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "Contrato no encontrado con ID: " + id, HttpStatus.NOT_FOUND);
        }

        Contrato contratoToUpdate = contrato.get();

        // Crear el objeto PDF con los datos
        PDF pdf = new PDF("CONTRATO", pdfBytes, nombreArchivo);
        PDF pdfGuardado = pdfService.guardarPDF(pdf.getAmbito(), pdfBytes, nombreArchivo);

        // Asignar el ID del PDF al contrato
        contratoToUpdate.setIdPDF(pdfGuardado.getId());
        Contrato contratoActualizado = contratoRepository.save(contratoToUpdate);

        logger.info("PDF guardado exitosamente para contrato ID: {} con PDF ID: {}", id, pdfGuardado.getId());
        return enrichContratoDTO(contratoActualizado);
    }

    // Obtener PDF de un contrato
    public byte[] obtenerPdf(Long id) {
        Optional<Contrato> contrato = contratoRepository.findById(id);
        if (!contrato.isPresent()) {
            throw new BusinessException(ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "Contrato no encontrado con ID: " + id, HttpStatus.NOT_FOUND);
        }

        Long idPDF = contrato.get().getIdPDF();
        if (idPDF == null) {
            throw new BusinessException(ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "El contrato ID " + id + " no tiene un PDF asociado", HttpStatus.NOT_FOUND);
        }

        Optional<PDF> pdf = pdfService.obtenerPDF(idPDF);
        if (pdf.isEmpty()) {
            throw new BusinessException(ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "El PDF asociado al contrato ID " + id + " no existe", HttpStatus.NOT_FOUND);
        }

        byte[] pdfBytes = pdf.get().getFile();
        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new BusinessException(ErrorCodes.CONTRATO_NO_ENCONTRADO,
                "El PDF del contrato ID " + id + " está vacío", HttpStatus.NOT_FOUND);
        }

        logger.info("PDF obtenido para contrato ID: {}", id);
        return pdfBytes;
    }

    /**
     * Anula todos los alquileres asociados a un contrato.
     * Se llama cuando el contrato cambia a estado "No Vigente" o "Cancelado"
     * Implementa borrado lógico (esActivo = false) en lugar de físico
     *
     * @param contratoId ID del contrato cuyos alquileres serán anulados
     */
    private void anularAlquileresDelContrato(Long contratoId) {
        try {
            // Obtener todos los alquileres activos del contrato
            List<com.alquileres.model.Alquiler> alquileres = alquilerRepository.findByContratoId(contratoId);

            if (alquileres != null && !alquileres.isEmpty()) {
                // Marcar todos los alquileres como inactivos (borrado lógico)
                for (com.alquileres.model.Alquiler alquiler : alquileres) {
                    alquiler.setEsActivo(false);
                }
                alquilerRepository.saveAll(alquileres);
                logger.info("Se anularon {} alquileres del contrato ID: {} (borrado lógico)", alquileres.size(), contratoId);
            } else {
                logger.info("No hay alquileres para anular en el contrato ID: {}", contratoId);
            }
        } catch (Exception e) {
            logger.error("Error al anular alquileres del contrato ID: {}", contratoId, e);
            throw new BusinessException(ErrorCodes.ERROR_INTERNO,
                "Error al anular los alquileres del contrato", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
