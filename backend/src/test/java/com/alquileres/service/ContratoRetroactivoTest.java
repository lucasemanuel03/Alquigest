package com.alquileres.service;

import com.alquileres.dto.ContratoCreateDTO;
import com.alquileres.dto.ContratoDTO;
import com.alquileres.model.*;
import com.alquileres.repository.*;
import com.alquileres.security.EncryptionService;
import com.alquileres.util.BCRAApiClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests para la funcionalidad de creación de alquileres retroactivos
 * cuando se crea un contrato con fecha de inicio en el pasado
 */
@ExtendWith(MockitoExtension.class)
class ContratoRetroactivoTest {

    @Mock
    private ContratoRepository contratoRepository;

    @Mock
    private InmuebleRepository inmuebleRepository;

    @Mock
    private InquilinoRepository inquilinoRepository;

    @Mock
    private EstadoContratoRepository estadoContratoRepository;

    @Mock
    private EstadoInmuebleRepository estadoInmuebleRepository;

    @Mock
    private PropietarioRepository propietarioRepository;

    @Mock
    private TipoInmuebleRepository tipoInmuebleRepository;

    @Mock
    private CancelacionContratoRepository cancelacionContratoRepository;

    @Mock
    private MotivoCancelacionRepository motivoCancelacionRepository;

    @Mock
    private AlquilerRepository alquilerRepository;

    @Mock
    private AlquilerActualizacionService alquilerActualizacionService;

    @Mock
    private ServicioXContratoService servicioXContratoService;

    @Mock
    private EncryptionService encryptionService;

    @Mock
    private PDFService pdfService;

    @Mock
    private BCRAApiClient bcraApiClient;

    @Mock
    private AumentoAlquilerService aumentoAlquilerService;

    @InjectMocks
    private ContratoService contratoService;

    private Inmueble inmueble;
    private Inquilino inquilino;
    private EstadoContrato estadoVigente;
    private EstadoInmueble estadoAlquilado;

    @BeforeEach
    void setUp() {
        // Setup inmueble
        inmueble = new Inmueble();
        inmueble.setId(1L);
        inmueble.setDireccion("Calle Falsa 123");
        inmueble.setEstado(1);
        inmueble.setPropietarioId(1L);
        inmueble.setTipoInmuebleId(1L);

        // Setup inquilino
        inquilino = new Inquilino();
        inquilino.setId(1L);
        inquilino.setNombre("Juan");
        inquilino.setApellido("Pérez");
        inquilino.setEstaAlquilando(false);

        // Setup estado vigente
        estadoVigente = new EstadoContrato();
        estadoVigente.setId(1);
        estadoVigente.setNombre("Vigente");

        // Setup estado alquilado
        estadoAlquilado = new EstadoInmueble();
        estadoAlquilado.setId(1);
        estadoAlquilado.setNombre("Alquilado");
    }

    /**
     * Test que verifica que se crean alquileres retroactivos cuando la fecha de inicio
     * es 3 meses en el pasado con periodoAumento=3 (un solo aumento)
     */
    @Test
    void crearContrato_conFechaInicioEnElPasado_creaAlquileresRetroactivos() {
        // Arrange
        LocalDate hoy = LocalDate.now();
        LocalDate fechaInicio = hoy.minusMonths(3); // 3 meses atrás
        
        ContratoCreateDTO contratoDTO = new ContratoCreateDTO();
        contratoDTO.setInmuebleId(1L);
        contratoDTO.setInquilinoId(1L);
        contratoDTO.setFechaInicio(fechaInicio.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        contratoDTO.setFechaFin(hoy.plusYears(2).format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        contratoDTO.setMonto(new BigDecimal("100000"));
        contratoDTO.setPorcentajeAumento(new BigDecimal("10"));
        contratoDTO.setAumentaConIcl(false);
        contratoDTO.setPeriodoAumento(3);
        contratoDTO.setEstadoContratoId(1);

        // Setup mocks
        when(inmuebleRepository.findById(1L)).thenReturn(Optional.of(inmueble));
        when(inquilinoRepository.findById(1L)).thenReturn(Optional.of(inquilino));
        when(estadoContratoRepository.findById(1)).thenReturn(Optional.of(estadoVigente));
        when(estadoInmuebleRepository.findByNombre("Alquilado")).thenReturn(Optional.of(estadoAlquilado));
        when(contratoRepository.existsContratoVigenteByInmueble(any())).thenReturn(false);
        
        // Crear contrato que será guardado
        Contrato contratoGuardado = new Contrato();
        contratoGuardado.setId(1L);
        contratoGuardado.setInmueble(inmueble);
        contratoGuardado.setInquilino(inquilino);
        contratoGuardado.setFechaInicio(fechaInicio.format(DateTimeFormatter.ISO_LOCAL_DATE));
        contratoGuardado.setFechaFin(hoy.plusYears(2).format(DateTimeFormatter.ISO_LOCAL_DATE));
        contratoGuardado.setMonto(new BigDecimal("100000"));
        contratoGuardado.setPorcentajeAumento(new BigDecimal("10"));
        contratoGuardado.setAumentaConIcl(false);
        contratoGuardado.setPeriodoAumento(3);
        contratoGuardado.setEstadoContrato(estadoVigente);
        contratoGuardado.setFechaAumento(fechaInicio.plusMonths(3).withDayOfMonth(1).format(DateTimeFormatter.ISO_LOCAL_DATE));
        
        when(contratoRepository.save(any(Contrato.class))).thenReturn(contratoGuardado);
        
        // Lista para capturar alquileres guardados
        List<Alquiler> alquileresGuardados = new ArrayList<>();
        when(alquilerRepository.saveAll(anyList())).thenAnswer(invocation -> {
            List<Alquiler> arg = invocation.getArgument(0);
            alquileresGuardados.addAll(arg);
            return arg;
        });
        
        // Act
        ContratoDTO resultado = contratoService.crearContrato(contratoDTO);

        // Assert
        assertNotNull(resultado);
        
        // Verificar que se guardaron alquileres
        verify(alquilerRepository, times(1)).saveAll(anyList());
        
        // Debería haber creado 3 alquileres:
        // - Mes 0 (fecha inicio con la fecha exacta): ej. 05/08/2025
        // - Mes 1: 01/09/2025
        // - Mes 2: 01/10/2025
        assertTrue(alquileresGuardados.size() >= 3, 
                  "Debe crear al menos 3 alquileres retroactivos (uno por mes desde hace 3 meses)");
        
        // Verificar que todos están marcados como pagados
        for (Alquiler alquiler : alquileresGuardados) {
            assertTrue(alquiler.getEstaPagado(), "Todos los alquileres retroactivos deben estar marcados como pagados");
            assertNotNull(alquiler.getFechaPago(), "Todos los alquileres retroactivos deben tener fecha de pago");
            assertTrue(alquiler.getEsActivo(), "Todos los alquileres retroactivos deben estar activos");
        }
        
        // En este caso, NO debe haber aumentos porque pasaron exactamente 3 meses 
        // y el aumento se aplicaría a partir del mes 4 (cuando se cumpla el período de aumento)
        // Por lo tanto, verificamos que se guardaron los alquileres pero NO aumentos
        verify(aumentoAlquilerService, never()).guardarAumentosEnBatch(anyList());
    }

    /**
     * Test que verifica que se crean alquileres retroactivos con aumento por ICL
     */
    @Test
    void crearContrato_conFechaInicioEnElPasadoYAumentoICL_consultaBCRA() {
        // Arrange
        LocalDate hoy = LocalDate.now();
        LocalDate fechaInicio = hoy.minusMonths(4); // 4 meses atrás
        
        ContratoCreateDTO contratoDTO = new ContratoCreateDTO();
        contratoDTO.setInmuebleId(1L);
        contratoDTO.setInquilinoId(1L);
        contratoDTO.setFechaInicio(fechaInicio.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        contratoDTO.setFechaFin(hoy.plusYears(2).format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        contratoDTO.setMonto(new BigDecimal("100000"));
        contratoDTO.setAumentaConIcl(true);
        contratoDTO.setPeriodoAumento(3);
        contratoDTO.setEstadoContratoId(1);

        // Setup mocks
        when(inmuebleRepository.findById(1L)).thenReturn(Optional.of(inmueble));
        when(inquilinoRepository.findById(1L)).thenReturn(Optional.of(inquilino));
        when(estadoContratoRepository.findById(1)).thenReturn(Optional.of(estadoVigente));
        when(estadoInmuebleRepository.findByNombre("Alquilado")).thenReturn(Optional.of(estadoAlquilado));
        when(contratoRepository.existsContratoVigenteByInmueble(any())).thenReturn(false);
        
        // Crear contrato que será guardado
        Contrato contratoGuardado = new Contrato();
        contratoGuardado.setId(1L);
        contratoGuardado.setInmueble(inmueble);
        contratoGuardado.setInquilino(inquilino);
        contratoGuardado.setFechaInicio(fechaInicio.format(DateTimeFormatter.ISO_LOCAL_DATE));
        contratoGuardado.setFechaFin(hoy.plusYears(2).format(DateTimeFormatter.ISO_LOCAL_DATE));
        contratoGuardado.setMonto(new BigDecimal("100000"));
        contratoGuardado.setAumentaConIcl(true);
        contratoGuardado.setPeriodoAumento(3);
        contratoGuardado.setEstadoContrato(estadoVigente);
        contratoGuardado.setFechaAumento(fechaInicio.plusMonths(3).withDayOfMonth(1).format(DateTimeFormatter.ISO_LOCAL_DATE));
        
        when(contratoRepository.save(any(Contrato.class))).thenReturn(contratoGuardado);
        
        // Mock de BCRAApiClient para devolver una tasa de aumento
        when(bcraApiClient.obtenerTasaAumentoICL(anyString(), anyString()))
            .thenReturn(new BigDecimal("1.05")); // 5% de aumento
        
        // Lista para capturar alquileres guardados
        when(alquilerRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        
        // Mock para aumentos
        when(aumentoAlquilerService.crearAumentoSinGuardar(any(), any(), any(), any()))
            .thenAnswer(invocation -> new AumentoAlquiler());
        
        // Act
        ContratoDTO resultado = contratoService.crearContrato(contratoDTO);

        // Assert
        assertNotNull(resultado);
        
        // Verificar que se consultó la API del BCRA al menos una vez
        verify(bcraApiClient, atLeastOnce()).obtenerTasaAumentoICL(anyString(), anyString());
        
        // Verificar que se guardaron aumentos
        verify(aumentoAlquilerService, atLeastOnce()).guardarAumentosEnBatch(anyList());
    }

    /**
     * Test que verifica que NO se crean alquileres retroactivos cuando la fecha
     * de inicio es hoy o en el futuro
     */
    @Test
    void crearContrato_conFechaInicioHoy_noCreaalquileresRetroactivos() {
        // Arrange
        LocalDate hoy = LocalDate.now();
        
        ContratoCreateDTO contratoDTO = new ContratoCreateDTO();
        contratoDTO.setInmuebleId(1L);
        contratoDTO.setInquilinoId(1L);
        contratoDTO.setFechaInicio(hoy.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        contratoDTO.setFechaFin(hoy.plusYears(2).format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        contratoDTO.setMonto(new BigDecimal("100000"));
        contratoDTO.setPorcentajeAumento(new BigDecimal("10"));
        contratoDTO.setAumentaConIcl(false);
        contratoDTO.setPeriodoAumento(3);
        contratoDTO.setEstadoContratoId(1);

        // Setup mocks
        when(inmuebleRepository.findById(1L)).thenReturn(Optional.of(inmueble));
        when(inquilinoRepository.findById(1L)).thenReturn(Optional.of(inquilino));
        when(estadoContratoRepository.findById(1)).thenReturn(Optional.of(estadoVigente));
        when(estadoInmuebleRepository.findByNombre("Alquilado")).thenReturn(Optional.of(estadoAlquilado));
        when(contratoRepository.existsContratoVigenteByInmueble(any())).thenReturn(false);
        
        // Crear contrato que será guardado
        Contrato contratoGuardado = new Contrato();
        contratoGuardado.setId(1L);
        contratoGuardado.setInmueble(inmueble);
        contratoGuardado.setInquilino(inquilino);
        contratoGuardado.setFechaInicio(hoy.format(DateTimeFormatter.ISO_LOCAL_DATE));
        contratoGuardado.setFechaFin(hoy.plusYears(2).format(DateTimeFormatter.ISO_LOCAL_DATE));
        contratoGuardado.setMonto(new BigDecimal("100000"));
        contratoGuardado.setPorcentajeAumento(new BigDecimal("10"));
        contratoGuardado.setAumentaConIcl(false);
        contratoGuardado.setPeriodoAumento(3);
        contratoGuardado.setEstadoContrato(estadoVigente);
        contratoGuardado.setFechaAumento(hoy.plusMonths(3).withDayOfMonth(1).format(DateTimeFormatter.ISO_LOCAL_DATE));
        
        when(contratoRepository.save(any(Contrato.class))).thenReturn(contratoGuardado);
        when(alquilerRepository.save(any(Alquiler.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        // Act
        ContratoDTO resultado = contratoService.crearContrato(contratoDTO);

        // Assert
        assertNotNull(resultado);
        
        // Verificar que NO se llamó a saveAll (alquileres retroactivos)
        verify(alquilerRepository, never()).saveAll(anyList());
        
        // Verificar que se llamó a save (un solo alquiler)
        verify(alquilerRepository, times(1)).save(any(Alquiler.class));
        
        // Verificar que NO se guardaron aumentos retroactivos
        verify(aumentoAlquilerService, never()).guardarAumentosEnBatch(anyList());
    }
}
