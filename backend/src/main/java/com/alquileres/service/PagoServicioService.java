package com.alquileres.service;

import com.alquileres.dto.ActualizacionMontoServicioDTO;
import com.alquileres.dto.ActualizacionMontosServiciosRequest;
import com.alquileres.dto.ActualizarPagoServicioRequest;
import com.alquileres.dto.RegistroPagoBatchRequest;
import com.alquileres.dto.RegistroPagoBatchResponse;
import com.alquileres.model.PagoServicio;
import com.alquileres.repository.ContratoRepository;
import com.alquileres.repository.PagoServicioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio para la gestión de pagos de servicios
 */
@Service
public class PagoServicioService {

    private static final Logger logger = LoggerFactory.getLogger(PagoServicioService.class);

    @Autowired
    private PagoServicioRepository pagoServicioRepository;

    @Autowired
    private ContratoRepository contratoRepository;

    /**
     * Actualiza los montos de los pagos de servicios no pagados de un contrato
     *
     * @param request Datos de actualización con contratoId y lista de actualizaciones
     * @return Mapa con resumen de actualizaciones realizadas
     */
    @Transactional
    public Map<String, Object> actualizarMontosPagosNoPagados(ActualizacionMontosServiciosRequest request) {
        logger.info("Iniciando actualización de montos para contrato ID: {}", request.getContratoId());

        // Verificar que el contrato existe
        if (!contratoRepository.existsById(request.getContratoId())) {
            throw new RuntimeException("El contrato con ID " + request.getContratoId() + " no existe");
        }

        Map<String, Object> resultado = new HashMap<>();
        int totalActualizados = 0;
        Map<Integer, Integer> detallesPorTipoServicio = new HashMap<>();

        // Procesar cada actualización de tipo de servicio
        for (ActualizacionMontoServicioDTO actualizacion : request.getActualizaciones()) {
            // Validar que el monto no sea nulo o cero
            if (actualizacion.getNuevoMonto() == null ||
                actualizacion.getNuevoMonto().compareTo(BigDecimal.ZERO) <= 0) {
                logger.warn("Monto inválido para tipo de servicio ID: {}. Se omite.",
                           actualizacion.getTipoServicioId());
                continue;
            }

            // Buscar todos los pagos no pagados para este contrato y tipo de servicio
            List<PagoServicio> pagosNoPagados = pagoServicioRepository
                .findPagosNoPagadosByContratoAndTipoServicio(
                    request.getContratoId(),
                    actualizacion.getTipoServicioId()
                );

            int actualizadosEnEsteTipo = 0;

            // Actualizar el monto de cada pago
            for (PagoServicio pago : pagosNoPagados) {
                pago.setMonto(actualizacion.getNuevoMonto());
                pagoServicioRepository.save(pago);
                actualizadosEnEsteTipo++;
                totalActualizados++;

                logger.debug("Actualizado monto del pago ID: {} a {}",
                            pago.getId(), actualizacion.getNuevoMonto());
            }

            detallesPorTipoServicio.put(actualizacion.getTipoServicioId(), actualizadosEnEsteTipo);

            logger.info("Actualizados {} pagos del tipo de servicio ID: {} con monto: {}",
                       actualizadosEnEsteTipo,
                       actualizacion.getTipoServicioId(),
                       actualizacion.getNuevoMonto());
        }

        resultado.put("contratoId", request.getContratoId());
        resultado.put("totalPagosActualizados", totalActualizados);
        resultado.put("detallesPorTipoServicio", detallesPorTipoServicio);
        resultado.put("mensaje", "Actualización completada exitosamente");

        logger.info("Actualización completada. Total de pagos actualizados: {}", totalActualizados);

        return resultado;
    }

    /**
     * Obtiene todos los pagos no pagados de un contrato
     *
     * @param contratoId ID del contrato
     * @return Lista de pagos no pagados
     */
    public List<PagoServicio> obtenerPagosNoPagadosPorContrato(Long contratoId) {
        return pagoServicioRepository.findPagosNoPagadosByContrato(contratoId);
    }

    /**
     * Obtiene todos los pagos de un contrato
     *
     * @param contratoId ID del contrato
     * @return Lista de todos los pagos del contrato
     */
    public List<PagoServicio> obtenerPagosPorContrato(Long contratoId) {
        return pagoServicioRepository.findByContratoId(contratoId);
    }

    /**
     * Actualiza un pago de servicio específico
     *
     * @param pagoId ID del pago a actualizar
     * @param request Datos a actualizar
     * @return Pago actualizado
     */
    @Transactional
    public PagoServicio actualizarPagoServicio(Integer pagoId, ActualizarPagoServicioRequest request) {
        logger.info("Actualizando pago de servicio ID: {}", pagoId);

        // Buscar el pago
        PagoServicio pago = pagoServicioRepository.findById(pagoId)
            .orElseThrow(() -> new RuntimeException("Pago de servicio con ID " + pagoId + " no encontrado"));

        // Actualizar solo los campos que no sean nulos
        if (request.getPeriodo() != null) {
            pago.setPeriodo(request.getPeriodo());
            logger.debug("Periodo actualizado a: {}", request.getPeriodo());
        }

        if (request.getFechaPago() != null) {
            pago.setFechaPago(request.getFechaPago());
            logger.debug("Fecha de pago actualizada a: {}", request.getFechaPago());
        }

        if (request.getEstaPagado() != null) {
            pago.setEstaPagado(request.getEstaPagado());
            logger.debug("Estado de pago actualizado a: {}", request.getEstaPagado());
        }

        if (request.getEstaVencido() != null) {
            pago.setEstaVencido(request.getEstaVencido());
            logger.debug("Estado de vencimiento actualizado a: {}", request.getEstaVencido());
        }

        if (request.getPdfPath() != null) {
            pago.setPdfPath(request.getPdfPath());
            logger.debug("PDF path actualizado a: {}", request.getPdfPath());
        }

        if (request.getMedioPago() != null) {
            pago.setMedioPago(request.getMedioPago());
            logger.debug("Medio de pago actualizado a: {}", request.getMedioPago());
        }

        if (request.getMonto() != null) {
            pago.setMonto(request.getMonto());
            logger.debug("Monto actualizado a: {}", request.getMonto());
        }

        PagoServicio pagoActualizado = pagoServicioRepository.save(pago);
        logger.info("Pago de servicio ID {} actualizado exitosamente", pagoId);

        return pagoActualizado;
    }

    /**
     * Obtiene un pago de servicio por su ID
     *
     * @param pagoId ID del pago
     * @return Pago encontrado
     */
    public PagoServicio obtenerPagoPorId(Integer pagoId) {
        return pagoServicioRepository.findById(pagoId)
            .orElseThrow(() -> new RuntimeException("Pago de servicio con ID " + pagoId + " no encontrado"));
    }

    /**
     * Cuenta los pagos de servicio del mes actual
     * Retorna tanto los totales activos como los pendientes (no pagados)
     *
     * @return Mapa con serviciosTotales y serviciosPendientes del mes actual
     */
    @Cacheable(value = "pagosPendientes", key = "'count'")
    public Map<String, Long> contarPagosPendientes() {
        logger.debug("Contando pagos de servicio del mes actual");

        // Obtener el período actual en formato mm/yyyy
        java.time.LocalDate fechaActual = java.time.LocalDate.now();
        String periodoActual = String.format("%02d/%d",
            fechaActual.getMonthValue(),
            fechaActual.getYear()
        );

        // Contar totales activos del mes actual
        Long serviciosTotales = pagoServicioRepository.countPagosActivosPorPeriodo(periodoActual);

        // Contar pendientes (no pagados) activos del mes actual
        Long serviciosPendientes = pagoServicioRepository.countPagosPendientesPorPeriodo(periodoActual);

        logger.info("Servicios del mes actual ({}): {} totales, {} pendientes",
            periodoActual, serviciosTotales, serviciosPendientes);

        Map<String, Long> resultado = new HashMap<>();
        resultado.put("serviciosTotales", serviciosTotales);
        resultado.put("serviciosPendientes", serviciosPendientes);

        return resultado;
    }

    /**
     * Registra múltiples pagos de servicio en batch (procesamiento por lotes)
     * Cada pago se procesa individualmente y el resultado se agrega a la respuesta
     * Si un pago falla, se registra el error pero se continúa con los demás
     *
     * @param request Solicitud con lista de pagos a registrar
     * @return Respuesta con resumen de procesamiento y detalle de cada pago
     */
    @Transactional
    public RegistroPagoBatchResponse registrarPagosBatch(RegistroPagoBatchRequest request) {
        logger.info("Iniciando registro de pagos en batch. Total de pagos a procesar: {}",
                   request.getPagos().size());

        RegistroPagoBatchResponse response = new RegistroPagoBatchResponse();
        List<RegistroPagoBatchResponse.ResultadoPagoItem> resultados = new ArrayList<>();
        int exitosos = 0;
        int fallidos = 0;

        // Procesar cada pago individualmente
        for (RegistroPagoBatchRequest.RegistroPagoServicioItem item : request.getPagos()) {
            RegistroPagoBatchResponse.ResultadoPagoItem resultado =
                new RegistroPagoBatchResponse.ResultadoPagoItem();
            resultado.setPagoId(item.getPagoId());

            try {
                // Intentar actualizar el pago usando el método existente
                PagoServicio pagoActualizado = actualizarPagoServicio(
                    item.getPagoId(),
                    item.getDatosPago()
                );

                resultado.setExitoso(true);
                resultado.setMensaje("Pago registrado exitosamente");
                exitosos++;

                logger.debug("Pago ID {} procesado exitosamente en batch", item.getPagoId());

            } catch (Exception e) {
                resultado.setExitoso(false);
                resultado.setMensaje("Error: " + e.getMessage());
                fallidos++;

                logger.error("Error al procesar pago ID {} en batch: {}",
                           item.getPagoId(), e.getMessage());
            }

            resultados.add(resultado);
        }

        // Configurar la respuesta
        response.setTotalProcesados(request.getPagos().size());
        response.setExitosos(exitosos);
        response.setFallidos(fallidos);
        response.setResultados(resultados);

        logger.info("Procesamiento batch completado. Exitosos: {}, Fallidos: {}, Total: {}",
                   exitosos, fallidos, request.getPagos().size());

        return response;
    }
}
