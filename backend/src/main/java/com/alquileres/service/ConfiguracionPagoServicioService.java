package com.alquileres.service;

import com.alquileres.model.ConfiguracionPagoServicio;
import com.alquileres.model.ServicioXContrato;
import com.alquileres.repository.ConfiguracionPagoServicioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class ConfiguracionPagoServicioService {

    private static final Logger logger = LoggerFactory.getLogger(ConfiguracionPagoServicioService.class);
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter FORMATO_FECHA_USUARIO = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Autowired
    private ConfiguracionPagoServicioRepository configuracionPagoServicioRepository;

    /**
     * Convierte una fecha a formato ISO si viene en formato de usuario
     * Soporta formatos: dd/MM/yyyy e yyyy-MM-dd
     */
    private String normalizarFecha(String fecha) {
        if (fecha == null || fecha.trim().isEmpty()) {
            return LocalDate.now().format(FORMATO_FECHA);
        }

        try {
            // Intenta parsear como ISO
            LocalDate date = LocalDate.parse(fecha, FORMATO_FECHA);
            return date.format(FORMATO_FECHA);
        } catch (Exception e1) {
            try {
                // Intenta parsear como formato de usuario (dd/MM/yyyy)
                LocalDate date = LocalDate.parse(fecha, FORMATO_FECHA_USUARIO);
                return date.format(FORMATO_FECHA);
            } catch (Exception e2) {
                logger.warn("No se pudo parsear la fecha '{}'. Usando fecha actual.", fecha);
                return LocalDate.now().format(FORMATO_FECHA);
            }
        }
    }

    /**
     * Crea una configuración de pago para un servicio x contrato
     * Calcula automáticamente el próximo pago basándose en si es anual o mensual
     * NOTA: Este método NO tiene @Transactional porque se llama desde métodos
     * que ya están en una transacción (crearServicioYConfiguracion)
     *
     * @param servicioXContrato El servicio x contrato
     * @param fechaInicio Fecha de inicio del servicio (acepta dd/MM/yyyy o yyyy-MM-dd)
     * @return La configuración creada
     */
    public ConfiguracionPagoServicio crearConfiguracion(ServicioXContrato servicioXContrato, String fechaInicio) {
        // Normalizar la fecha de entrada
        String fechaInicioNormalizada = normalizarFecha(fechaInicio);

        // Verificar si ya existe una configuración para este servicio
        Optional<ConfiguracionPagoServicio> existente = configuracionPagoServicioRepository
                .findByServicioXContratoId(servicioXContrato.getId());

        if (existente.isPresent()) {
            logger.warn("Ya existe una configuración para el servicio x contrato ID: {}", servicioXContrato.getId());
            return existente.get();
        }

        ConfiguracionPagoServicio configuracion = new ConfiguracionPagoServicio();
        configuracion.setServicioXContrato(servicioXContrato);
        configuracion.setFechaInicio(fechaInicioNormalizada);
        configuracion.setEsActivo(true);

        // Establecer proximoPago como la fecha de inicio para que el primer pago se genere inmediatamente
        // Después de generar el primer pago, se actualizará a fechaInicio + 1 mes/ano
        configuracion.setProximoPago(fechaInicioNormalizada);

        return configuracionPagoServicioRepository.save(configuracion);
    }

    /**
     * Actualiza la configuración después de generar un pago
     * Calcula el nuevo próximo pago basándose en si es anual o mensual
     * NOTA: Este método NO tiene @Transactional porque se llama desde métodos
     * que ya están en una transacción (generarFacturaParaPeriodo)
     *
     * @param configuracion La configuración a actualizar
     * @param fechaPagoGenerado Fecha del pago que se acaba de generar (acepta dd/MM/yyyy o yyyy-MM-dd)
     * @return La configuración actualizada
     */
    public ConfiguracionPagoServicio actualizarDespuesDeGenerarPago(
            ConfiguracionPagoServicio configuracion, String fechaPagoGenerado) {

        // Normalizar la fecha de entrada
        String fechaPagoGeneradoNormalizada = normalizarFecha(fechaPagoGenerado);

        configuracion.setUltimoPagoGenerado(fechaPagoGeneradoNormalizada);

        // Calcular el próximo pago basándose en la fecha del último pago generado
        Boolean esAnual = configuracion.getServicioXContrato().getEsAnual();
        String proximoPago = calcularProximoPago(fechaPagoGeneradoNormalizada, esAnual);

        configuracion.setProximoPago(proximoPago);

        return configuracionPagoServicioRepository.save(configuracion);
    }

    /**
     * Calcula la fecha del próximo pago
     * Si esAnual = true, suma 1 ano
     * Si esAnual = false, suma 1 mes
     *
     * @param fechaBase Fecha base para el cálculo
     * @param esAnual Si el servicio se paga anualmente
     * @return La fecha del próximo pago en formato ISO
     */
    private String calcularProximoPago(String fechaBase, Boolean esAnual) {
        try {
            LocalDate fecha = LocalDate.parse(fechaBase, FORMATO_FECHA);
            LocalDate proximaFecha;

            if (Boolean.TRUE.equals(esAnual)) {
                // Si es anual, sumar 1 ano
                proximaFecha = fecha.plusYears(1);
                logger.debug("Calculando próximo pago anual. Base: {}, Próximo: {}", fechaBase, proximaFecha);
            } else {
                // Si es mensual, sumar 1 mes
                proximaFecha = fecha.plusMonths(1);
                logger.debug("Calculando próximo pago mensual. Base: {}, Próximo: {}", fechaBase, proximaFecha);
            }

            return proximaFecha.format(FORMATO_FECHA);
        } catch (Exception e) {
            logger.error("Error calculando próximo pago desde fecha: {}", fechaBase, e);
            // En caso de error, retornar la fecha base
            return fechaBase;
        }
    }

    /**
     * Desactiva una configuración de pago
     *
     * @param configuracionId ID de la configuración
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void desactivarConfiguracion(Integer configuracionId) {
        Optional<ConfiguracionPagoServicio> configuracion = configuracionPagoServicioRepository
                .findById(configuracionId);

        if (configuracion.isPresent()) {
            ConfiguracionPagoServicio config = configuracion.get();
            config.setEsActivo(false);
            configuracionPagoServicioRepository.save(config);
            logger.info("Configuración de pago desactivada. ID: {}", configuracionId);
        }
    }

    /**
     * Obtiene la configuración de un servicio x contrato
     *
     * @param servicioXContratoId ID del servicio x contrato
     * @return La configuración si existe
     */
    public Optional<ConfiguracionPagoServicio> obtenerPorServicioXContrato(Integer servicioXContratoId) {
        return configuracionPagoServicioRepository.findByServicioXContratoId(servicioXContratoId);
    }
}
