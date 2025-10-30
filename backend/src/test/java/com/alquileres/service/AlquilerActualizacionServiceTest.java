package com.alquileres.service;

import com.alquileres.model.Alquiler;
import com.alquileres.model.Contrato;
import com.alquileres.model.EstadoContrato;
import com.alquileres.model.Inmueble;
import com.alquileres.model.Inquilino;
import com.alquileres.model.ConfiguracionSistema;
import com.alquileres.repository.AlquilerRepository;
import com.alquileres.repository.ContratoRepository;
import com.alquileres.repository.ConfiguracionSistemaRepository;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para AlquilerActualizacionService
 * Prueba la lógica de aumentos automáticos de alquileres
 */
@ExtendWith(MockitoExtension.class)
class AlquilerActualizacionServiceTest {

    @Mock
    private AlquilerRepository alquilerRepository;

    @Mock
    private ContratoRepository contratoRepository;

    @Mock
    private ConfiguracionSistemaRepository configuracionSistemaRepository;

    @Mock
    private BCRAApiClient bcraApiClient;

    @Mock
    private AumentoAlquilerService aumentoAlquilerService;

    @InjectMocks
    private AlquilerActualizacionService service;

    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter FORMATO_PERIODO = DateTimeFormatter.ofPattern("MM/yyyy");

    private EstadoContrato estadoVigente;
    private Inmueble inmueble;
    private Inquilino inquilino;

    @BeforeEach
    void setUp() {
        estadoVigente = new EstadoContrato();
        estadoVigente.setId(1);
        estadoVigente.setNombre("Vigente");

        inmueble = new Inmueble();
        inmueble.setId(1L);
        inmueble.setDireccion("Calle Falsa 123");

        inquilino = new Inquilino();
        inquilino.setId(1L);
        inquilino.setNombre("Juan");
        inquilino.setApellido("Pérez");
    }

    // ==================== TESTS DE VALIDACIÓN DE AUMENTO ====================

    @Test
    void debeAplicarAumento_mesYAnioCoinciden_debeRetornarTrue() {
        // Arrange
        LocalDate fechaActual = LocalDate.now();
        String fechaAumento = fechaActual.withDayOfMonth(1).format(FORMATO_FECHA);

        Contrato contrato = crearContratoConAumento(fechaAumento, 3, new BigDecimal("10"));
        when(contratoRepository.findContratosVigentes()).thenReturn(Collections.singletonList(contrato));
        when(alquilerRepository.findAlquileresPendientesByContratoIds(anyList())).thenReturn(Collections.emptyList());
        when(alquilerRepository.findTopByContratoOrderByFechaVencimientoPagoDesc(any())).thenReturn(Optional.empty());
        when(alquilerRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        // Act
        int resultado = service.crearAlquileresParaContratosVigentes();

        // Assert
        assertTrue(resultado > 0, "Debe crear al menos un alquiler con aumento");
        verify(aumentoAlquilerService, times(1)).crearAumentoSinGuardar(any(), any(), any(), any());
    }

    @Test
    void debeAplicarAumento_fechaAumentoYaPaso_debeRetornarTrue() {
        // Arrange
        LocalDate fechaPasada = LocalDate.now().minusMonths(2).withDayOfMonth(1);
        String fechaAumento = fechaPasada.format(FORMATO_FECHA);

        Contrato contrato = crearContratoConAumento(fechaAumento, 3, new BigDecimal("10"));
        when(contratoRepository.findContratosVigentes()).thenReturn(Collections.singletonList(contrato));
        when(alquilerRepository.findAlquileresPendientesByContratoIds(anyList())).thenReturn(Collections.emptyList());
        when(alquilerRepository.findTopByContratoOrderByFechaVencimientoPagoDesc(any())).thenReturn(Optional.empty());
        when(alquilerRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        // Act
        int resultado = service.crearAlquileresParaContratosVigentes();

        // Assert
        assertTrue(resultado > 0, "Debe crear alquiler con aumento atrasado");
        verify(aumentoAlquilerService, times(1)).crearAumentoSinGuardar(any(), any(), any(), any());
    }

    @Test
    void debeAplicarAumento_fechaAumentoFutura_noDebeAplicarAumento() {
        // Arrange
        LocalDate fechaFutura = LocalDate.now().plusMonths(2).withDayOfMonth(1);
        String fechaAumento = fechaFutura.format(FORMATO_FECHA);

        Contrato contrato = crearContratoConAumento(fechaAumento, 3, new BigDecimal("10"));
        when(contratoRepository.findContratosVigentes()).thenReturn(Collections.singletonList(contrato));
        when(alquilerRepository.findAlquileresPendientesByContratoIds(anyList())).thenReturn(Collections.emptyList());
        when(alquilerRepository.findTopByContratoOrderByFechaVencimientoPagoDesc(any())).thenReturn(Optional.empty());
        when(alquilerRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        // Act
        int resultado = service.crearAlquileresParaContratosVigentes();

        // Assert
        assertTrue(resultado > 0, "Debe crear alquiler sin aumento");
        verify(aumentoAlquilerService, never()).crearAumentoSinGuardar(any(), any(), any(), any());
    }

    @Test
    void debeAplicarAumento_fechaAumentoNoAumentaMas_noDebeAplicarAumento() {
        // Arrange
        Contrato contrato = crearContratoConAumento("No aumenta más", 3, new BigDecimal("10"));
        when(contratoRepository.findContratosVigentes()).thenReturn(Collections.singletonList(contrato));
        when(alquilerRepository.findAlquileresPendientesByContratoIds(anyList())).thenReturn(Collections.emptyList());
        when(alquilerRepository.findTopByContratoOrderByFechaVencimientoPagoDesc(any())).thenReturn(Optional.empty());
        when(alquilerRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        // Act
        int resultado = service.crearAlquileresParaContratosVigentes();

        // Assert
        assertTrue(resultado > 0, "Debe crear alquiler sin aumento");
        verify(aumentoAlquilerService, never()).crearAumentoSinGuardar(any(), any(), any(), any());
    }

    // ==================== TESTS DE AUMENTO FIJO (SIN ICL) ====================

    @Test
    void aumentoFijo_debeCalcularMontoCorrectamente() {
        // Arrange
        LocalDate fechaActual = LocalDate.now();
        String fechaAumento = fechaActual.withDayOfMonth(1).format(FORMATO_FECHA);
        BigDecimal montoBase = new BigDecimal("100000");
        BigDecimal porcentajeAumento = new BigDecimal("10"); // 10%

        Contrato contrato = crearContratoConAumento(fechaAumento, 3, porcentajeAumento);
        contrato.setMonto(montoBase);
        contrato.setAumentaConIcl(false);

        when(contratoRepository.findContratosVigentes()).thenReturn(Collections.singletonList(contrato));
        when(alquilerRepository.findAlquileresPendientesByContratoIds(anyList())).thenReturn(Collections.emptyList());
        when(alquilerRepository.findTopByContratoOrderByFechaVencimientoPagoDesc(any())).thenReturn(Optional.empty());
        when(alquilerRepository.saveAll(anyList())).thenAnswer(invocation -> {
            List<Alquiler> alquileres = invocation.getArgument(0);
            // Verificar que el monto calculado sea correcto: 100000 * 1.10 = 110000
            BigDecimal montoEsperado = new BigDecimal("110000.00");
            assertEquals(0, alquileres.get(0).getMonto().compareTo(montoEsperado),
                "El monto debe ser 100000 * 1.10 = 110000");
            return alquileres;
        });

        // Act
        service.crearAlquileresParaContratosVigentes();

        // Assert
        verify(alquilerRepository).saveAll(anyList());
        verify(aumentoAlquilerService).crearAumentoSinGuardar(
            eq(contrato),
            eq(montoBase),
            any(),
            eq(porcentajeAumento)
        );
    }

    @Test
    void aumentoFijo_conAlquilerPrevio_debeUsarMontoDelUltimoAlquiler() {
        // Arrange
        LocalDate fechaActual = LocalDate.now();
        String fechaAumento = fechaActual.withDayOfMonth(1).format(FORMATO_FECHA);
        BigDecimal montoContratoOriginal = new BigDecimal("100000");
        BigDecimal montoUltimoAlquiler = new BigDecimal("120000");
        BigDecimal porcentajeAumento = new BigDecimal("5"); // 5%

        Contrato contrato = crearContratoConAumento(fechaAumento, 3, porcentajeAumento);
        contrato.setMonto(montoContratoOriginal);
        contrato.setAumentaConIcl(false);

        Alquiler ultimoAlquiler = new Alquiler();
        ultimoAlquiler.setMonto(montoUltimoAlquiler);

        when(contratoRepository.findContratosVigentes()).thenReturn(Collections.singletonList(contrato));
        when(alquilerRepository.findAlquileresPendientesByContratoIds(anyList())).thenReturn(Collections.emptyList());
        when(alquilerRepository.findTopByContratoOrderByFechaVencimientoPagoDesc(any()))
            .thenReturn(Optional.of(ultimoAlquiler));
        when(alquilerRepository.saveAll(anyList())).thenAnswer(invocation -> {
            List<Alquiler> alquileres = invocation.getArgument(0);
            // Debe usar el monto del último alquiler: 120000 * 1.05 = 126000
            BigDecimal montoEsperado = new BigDecimal("126000.00");
            assertEquals(0, alquileres.get(0).getMonto().compareTo(montoEsperado),
                "El monto debe ser 120000 * 1.05 = 126000");
            return alquileres;
        });

        // Act
        service.crearAlquileresParaContratosVigentes();

        // Assert
        verify(alquilerRepository).saveAll(anyList());
        verify(aumentoAlquilerService).crearAumentoSinGuardar(
            eq(contrato),
            eq(montoUltimoAlquiler),
            any(),
            eq(porcentajeAumento)
        );
    }

    // ==================== TESTS DE AUMENTO CON ICL ====================

    @Test
    void aumentoConICL_debeConsultarAPIBCRA() {
        // Arrange
        LocalDate fechaActual = LocalDate.now();
        String fechaAumento = fechaActual.withDayOfMonth(1).format(FORMATO_FECHA);
        BigDecimal montoBase = new BigDecimal("100000");
        BigDecimal tasaICL = new BigDecimal("1.05"); // 5% de aumento

        Contrato contrato = crearContratoConAumento(fechaAumento, 3, null);
        contrato.setMonto(montoBase);
        contrato.setAumentaConIcl(true);

        when(contratoRepository.findContratosVigentes()).thenReturn(Collections.singletonList(contrato));
        when(alquilerRepository.findAlquileresPendientesByContratoIds(anyList())).thenReturn(Collections.emptyList());
        when(alquilerRepository.findTopByContratoOrderByFechaVencimientoPagoDesc(any())).thenReturn(Optional.empty());
        when(bcraApiClient.obtenerTasaAumentoICL(anyString(), anyString())).thenReturn(tasaICL);
        when(alquilerRepository.saveAll(anyList())).thenAnswer(invocation -> {
            List<Alquiler> alquileres = invocation.getArgument(0);
            // Verificar que el monto calculado sea correcto: 100000 * 1.05 = 105000
            BigDecimal montoEsperado = new BigDecimal("105000.00");
            assertEquals(0, alquileres.get(0).getMonto().compareTo(montoEsperado),
                "El monto debe ser 100000 * 1.05 = 105000");
            return alquileres;
        });

        // Act
        service.crearAlquileresParaContratosVigentes();

        // Assert
        verify(bcraApiClient).obtenerTasaAumentoICL(eq(fechaAumento), anyString());
        verify(alquilerRepository).saveAll(anyList());
        verify(aumentoAlquilerService).crearAumentoSinGuardar(any(), any(), any(), any());
    }

    @Test
    void aumentoConICL_errorEnAPI_debeUsarMontoSinAumento() {
        // Arrange
        LocalDate fechaActual = LocalDate.now();
        String fechaAumento = fechaActual.withDayOfMonth(1).format(FORMATO_FECHA);
        BigDecimal montoBase = new BigDecimal("100000");

        Contrato contrato = crearContratoConAumento(fechaAumento, 3, null);
        contrato.setMonto(montoBase);
        contrato.setAumentaConIcl(true);

        when(contratoRepository.findContratosVigentes()).thenReturn(Collections.singletonList(contrato));
        when(alquilerRepository.findAlquileresPendientesByContratoIds(anyList())).thenReturn(Collections.emptyList());
        when(alquilerRepository.findTopByContratoOrderByFechaVencimientoPagoDesc(any())).thenReturn(Optional.empty());
        when(bcraApiClient.obtenerTasaAumentoICL(anyString(), anyString()))
            .thenThrow(new RuntimeException("Error API BCRA"));
        when(alquilerRepository.saveAll(anyList())).thenAnswer(invocation -> {
            List<Alquiler> alquileres = invocation.getArgument(0);
            // Si falla la API, debe usar el monto base sin aumento
            assertEquals(0, alquileres.get(0).getMonto().compareTo(montoBase),
                "Debe usar el monto base al fallar la API");
            return alquileres;
        });

        // Act
        service.crearAlquileresParaContratosVigentes();

        // Assert
        verify(bcraApiClient).obtenerTasaAumentoICL(anyString(), anyString());
        verify(alquilerRepository).saveAll(anyList());
        verify(aumentoAlquilerService, never()).crearAumentoSinGuardar(any(), any(), any(), any());
    }

    // ==================== TESTS DE ACTUALIZACIÓN DE FECHA DE AUMENTO ====================

    @Test
    void actualizarFechaAumento_debeActualizarCorrectamente() {
        // Arrange
        LocalDate fechaActual = LocalDate.now();
        String fechaAumento = fechaActual.withDayOfMonth(1).format(FORMATO_FECHA);
        Integer periodoAumento = 3; // 3 meses

        Contrato contrato = crearContratoConAumento(fechaAumento, periodoAumento, new BigDecimal("10"));
        contrato.setFechaFin(fechaActual.plusYears(1).format(FORMATO_FECHA)); // Fecha fin lejana

        when(contratoRepository.findContratosVigentes()).thenReturn(Collections.singletonList(contrato));
        when(alquilerRepository.findAlquileresPendientesByContratoIds(anyList())).thenReturn(Collections.emptyList());
        when(alquilerRepository.findTopByContratoOrderByFechaVencimientoPagoDesc(any())).thenReturn(Optional.empty());
        when(alquilerRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));
        when(contratoRepository.save(any())).thenAnswer(invocation -> {
            Contrato c = invocation.getArgument(0);
            // Verificar que la nueva fechaAumento sea: fechaActual + 3 meses, día 1
            LocalDate nuevaFechaEsperada = fechaActual.plusMonths(periodoAumento).withDayOfMonth(1);
            assertEquals(nuevaFechaEsperada.format(FORMATO_FECHA), c.getFechaAumento(),
                "La fechaAumento debe actualizarse sumando el periodoAumento");
            return c;
        });

        // Act
        service.crearAlquileresParaContratosVigentes();

        // Assert
        verify(contratoRepository, atLeastOnce()).save(any(Contrato.class));
    }

    @Test
    void actualizarFechaAumento_superaFechaFin_debeEstablecerNoAumentaMas() {
        // Arrange
        LocalDate fechaActual = LocalDate.now();
        String fechaAumento = fechaActual.withDayOfMonth(1).format(FORMATO_FECHA);
        Integer periodoAumento = 3;

        Contrato contrato = crearContratoConAumento(fechaAumento, periodoAumento, new BigDecimal("10"));
        // Fecha fin cercana: solo 1 mes más
        contrato.setFechaFin(fechaActual.plusMonths(1).format(FORMATO_FECHA));

        when(contratoRepository.findContratosVigentes()).thenReturn(Collections.singletonList(contrato));
        when(alquilerRepository.findAlquileresPendientesByContratoIds(anyList())).thenReturn(Collections.emptyList());
        when(alquilerRepository.findTopByContratoOrderByFechaVencimientoPagoDesc(any())).thenReturn(Optional.empty());
        when(alquilerRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));
        when(contratoRepository.save(any())).thenAnswer(invocation -> {
            Contrato c = invocation.getArgument(0);
            // Como fechaAumento + 3 meses supera fechaFin, debe establecer "No aumenta más"
            assertEquals("No aumenta más", c.getFechaAumento(),
                "Debe establecer 'No aumenta más' cuando supera la fechaFin");
            return c;
        });

        // Act
        service.crearAlquileresParaContratosVigentes();

        // Assert
        verify(contratoRepository, atLeastOnce()).save(any(Contrato.class));
    }

    // ==================== TESTS DE PROCESAMIENTO MENSUAL ====================

    @Test
    void procesarAlquileresPendientes_mesYaProcesado_noDebeCrearAlquileres() {
        // Arrange
        String mesActual = LocalDate.now().format(FORMATO_PERIODO);
        ConfiguracionSistema config = new ConfiguracionSistema(
            "ULTIMO_MES_PROCESADO_ALQUILERES",
            mesActual,
            "Test"
        );

        when(configuracionSistemaRepository.findByClave(anyString()))
            .thenReturn(Optional.of(config));

        // Act
        int resultado = service.procesarAlquileresPendientes();

        // Assert
        assertEquals(0, resultado, "No debe crear alquileres si el mes ya fue procesado");
        verify(contratoRepository, never()).findContratosVigentes();
    }

    @Test
    void procesarAlquileresPendientes_mesNoProcesado_debeCrearAlquileres() {
        // Arrange
        String mesPasado = LocalDate.now().minusMonths(1).format(FORMATO_PERIODO);
        ConfiguracionSistema config = new ConfiguracionSistema(
            "ULTIMO_MES_PROCESADO_ALQUILERES",
            mesPasado,
            "Test"
        );

        Contrato contrato = crearContratoSinAumento();

        when(configuracionSistemaRepository.findByClave(anyString()))
            .thenReturn(Optional.of(config));
        when(contratoRepository.findContratosVigentes()).thenReturn(Collections.singletonList(contrato));
        when(alquilerRepository.findAlquileresPendientesByContratoIds(anyList())).thenReturn(Collections.emptyList());
        when(alquilerRepository.findTopByContratoOrderByFechaVencimientoPagoDesc(any())).thenReturn(Optional.empty());
        when(alquilerRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));
        when(configuracionSistemaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // Act
        int resultado = service.procesarAlquileresPendientes();

        // Assert
        assertTrue(resultado > 0, "Debe crear alquileres para el nuevo mes");
        verify(contratoRepository).findContratosVigentes();
        verify(alquilerRepository).saveAll(anyList());
    }

    // ==================== TESTS DE NO CREACIÓN DE ALQUILERES ====================

    @Test
    void crearAlquileres_contratoConAlquilerPendiente_noDebeCrearNuevo() {
        // Arrange
        Contrato contrato = crearContratoSinAumento();
        Alquiler alquilerPendiente = new Alquiler();
        alquilerPendiente.setContrato(contrato);
        alquilerPendiente.setEstaPagado(false);

        when(contratoRepository.findContratosVigentes()).thenReturn(Collections.singletonList(contrato));
        when(alquilerRepository.findAlquileresPendientesByContratoIds(anyList()))
            .thenReturn(Collections.singletonList(alquilerPendiente));

        // Act
        int resultado = service.crearAlquileresParaContratosVigentes();

        // Assert
        assertEquals(0, resultado, "No debe crear alquiler si ya existe uno pendiente");
        verify(alquilerRepository, never()).saveAll(anyList());
    }

    @Test
    void crearAlquileres_sinContratosVigentes_noDebeCrearAlquileres() {
        // Arrange
        when(contratoRepository.findContratosVigentes()).thenReturn(Collections.emptyList());

        // Act
        int resultado = service.crearAlquileresParaContratosVigentes();

        // Assert
        assertEquals(0, resultado, "No debe crear alquileres si no hay contratos vigentes");
        verify(alquilerRepository, never()).saveAll(anyList());
    }

    // ==================== MÉTODOS AUXILIARES ====================

    private Contrato crearContratoConAumento(String fechaAumento, Integer periodoAumento, BigDecimal porcentajeAumento) {
        Contrato contrato = new Contrato();
        contrato.setId(1L);
        contrato.setInmueble(inmueble);
        contrato.setInquilino(inquilino);
        contrato.setEstadoContrato(estadoVigente);
        contrato.setMonto(new BigDecimal("100000"));
        contrato.setFechaInicio(LocalDate.now().minusMonths(6).format(FORMATO_FECHA));
        contrato.setFechaFin(LocalDate.now().plusYears(1).format(FORMATO_FECHA));
        contrato.setFechaAumento(fechaAumento);
        contrato.setPeriodoAumento(periodoAumento);
        contrato.setPorcentajeAumento(porcentajeAumento);
        contrato.setAumentaConIcl(false);
        return contrato;
    }

    private Contrato crearContratoSinAumento() {
        Contrato contrato = new Contrato();
        contrato.setId(1L);
        contrato.setInmueble(inmueble);
        contrato.setInquilino(inquilino);
        contrato.setEstadoContrato(estadoVigente);
        contrato.setMonto(new BigDecimal("100000"));
        contrato.setFechaInicio(LocalDate.now().minusMonths(6).format(FORMATO_FECHA));
        contrato.setFechaFin(LocalDate.now().plusYears(1).format(FORMATO_FECHA));
        contrato.setFechaAumento(null);
        contrato.setPeriodoAumento(null);
        contrato.setPorcentajeAumento(null);
        contrato.setAumentaConIcl(false);
        return contrato;
    }
}

