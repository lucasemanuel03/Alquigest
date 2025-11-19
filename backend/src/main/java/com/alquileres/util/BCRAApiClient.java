package com.alquileres.util;

import com.alquileres.exception.BusinessException;
import com.alquileres.exception.ErrorCodes;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Component
public class BCRAApiClient {

    private static final Logger logger = LoggerFactory.getLogger(BCRAApiClient.class);
    private static final String BCRA_API_URL = "https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/40";
    private static final int TIMEOUT_SECONDS = 30;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public BCRAApiClient() {
        this.objectMapper = new ObjectMapper();
        HttpClient tempHttpClient = null;

        try {
            // Crear un TrustManager que acepte todos los certificados
            TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    @Override
                    public X509Certificate[] getAcceptedIssuers() {
                        return null;
                    }

                    @Override
                    public void checkClientTrusted(X509Certificate[] certs, String authType) {
                        // No hacer nada - aceptar todos
                    }

                    @Override
                    public void checkServerTrusted(X509Certificate[] certs, String authType) {
                        // No hacer nada - aceptar todos
                    }
                }
            };

            // Crear SSLContext con el TrustManager permisivo
            SSLContext sslContext = SSLContext.getInstance("TLS");
            sslContext.init(null, trustAllCerts, new java.security.SecureRandom());

            // Crear HttpClient con el SSLContext personalizado
            tempHttpClient = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(TIMEOUT_SECONDS))
                    .sslContext(sslContext)
                    .build();

            logger.info("HttpClient configurado con SSL permisivo para la API del BCRA");

        } catch (Exception e) {
            logger.error("Error al configurar SSL: {}", e.getMessage(), e);
            // Fallback a HttpClient estándar
            tempHttpClient = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(TIMEOUT_SECONDS))
                    .build();
        }

        this.httpClient = tempHttpClient;
    }

    /**
     * Obtiene la tasa de aumento del ICL desde la API del BCRA
     *
     * @param fechaInicio Fecha de inicio en formato yyyy-MM-dd
     * @param fechaFin Fecha de fin en formato yyyy-MM-dd
     * @return Tasa de aumento (cociente valorFin / valorInicio)
     */
    public BigDecimal obtenerTasaAumentoICL(String fechaInicio, String fechaFin) {
        try {
            logger.info("Consultando ICL del BCRA desde {} hasta {}", fechaInicio, fechaFin);

            // Construir URL con parámetros
            String url = String.format("%s?desde=%s&hasta=%s", BCRA_API_URL, fechaInicio, fechaFin);

            // Crear request
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(TIMEOUT_SECONDS))
                    .GET()
                    .build();

            // Ejecutar request
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            // Validar respuesta
            if (response.statusCode() != 200) {
                logger.error("Error al consultar BCRA API. Status code: {}", response.statusCode());
                throw new BusinessException(
                    ErrorCodes.ERROR_SERVICIO_EXTERNO,
                    "Error al consultar la API del BCRA. Código de estado: " + response.statusCode(),
                    HttpStatus.BAD_GATEWAY
                );
            }

            // Parsear JSON
            JsonNode rootNode = objectMapper.readTree(response.body());

            // Validar estructura
            if (!rootNode.has("results") || !rootNode.get("results").isArray() || rootNode.get("results").isEmpty()) {
                logger.error("Respuesta inválida de la API del BCRA: {}", response.body());
                throw new BusinessException(
                    ErrorCodes.ERROR_SERVICIO_EXTERNO,
                    "La API del BCRA devolvió una estructura de datos inválida",
                    HttpStatus.BAD_GATEWAY
                );
            }

            // Obtener el array de detalles
            JsonNode results = rootNode.get("results").get(0);
            if (!results.has("detalle") || !results.get("detalle").isArray()) {
                logger.error("No se encontró el detalle en la respuesta del BCRA");
                throw new BusinessException(
                    ErrorCodes.ERROR_SERVICIO_EXTERNO,
                    "No se encontraron datos de ICL para el período solicitado",
                    HttpStatus.BAD_GATEWAY
                );
            }

            JsonNode detalle = results.get("detalle");

            // Extraer valores del ICL en un mapa (fecha -> valor)
            Map<String, BigDecimal> valoresPorFecha = new HashMap<>();
            for (JsonNode nodo : detalle) {
                String fecha = nodo.get("fecha").asText();
                BigDecimal valor = new BigDecimal(nodo.get("valor").asText());
                valoresPorFecha.put(fecha, valor);
            }

            // Obtener valores de inicio y fin
            BigDecimal valorInicio = valoresPorFecha.get(fechaInicio);
            BigDecimal valorFin = valoresPorFecha.get(fechaFin);

            logger.info("=== === === Valores de ICL === === ===");
            logger.info("Fecha Inicio: {}, Valor: {}", fechaInicio, valorInicio);
            logger.info("Fecha Fin: {}, Valor: {}", fechaFin, valorFin);
            logger.info("=== === === Fin Valores ICL === === ===");

            // Validar que existan ambos valores
            if (valorInicio == null) {
                logger.error("No se encontró valor de ICL para la fecha de inicio: {}", fechaInicio);
                throw new BusinessException(
                    ErrorCodes.ERROR_SERVICIO_EXTERNO,
                    "No se encontró el valor del ICL para la fecha de inicio: " + fechaInicio,
                    HttpStatus.BAD_REQUEST
                );
            }

            if (valorFin == null) {
                logger.error("No se encontró valor de ICL para la fecha de fin: {}", fechaFin);
                throw new BusinessException(
                    ErrorCodes.ERROR_SERVICIO_EXTERNO,
                    "No se encontró el valor del ICL para la fecha de fin: " + fechaFin,
                    HttpStatus.BAD_REQUEST
                );
            }

            // Validar que valorInicio no sea cero
            if (valorInicio.compareTo(BigDecimal.ZERO) == 0) {
                logger.error("El valor de ICL de inicio es cero");
                throw new BusinessException(
                    ErrorCodes.ERROR_SERVICIO_EXTERNO,
                    "El valor del ICL de inicio no puede ser cero",
                    HttpStatus.BAD_REQUEST
                );
            }

            // Calcular tasa de aumento (cociente)
            BigDecimal tasaAumento = valorFin.divide(valorInicio, 10, RoundingMode.HALF_UP);

            logger.info("ICL obtenido - Inicio: {}, Fin: {}, Tasa de aumento: {}",
                       valorInicio, valorFin, tasaAumento);

            return tasaAumento;

        } catch (IOException e) {
            logger.error("Error de I/O al consultar la API del BCRA: {}", e.getMessage(), e);
            throw new BusinessException(
                ErrorCodes.ERROR_SERVICIO_EXTERNO,
                "Error de comunicación con la API del BCRA: " + e.getMessage(),
                HttpStatus.BAD_GATEWAY
            );
        } catch (InterruptedException e) {
            logger.error("Consulta a la API del BCRA interrumpida: {}", e.getMessage(), e);
            Thread.currentThread().interrupt();
            throw new BusinessException(
                ErrorCodes.ERROR_SERVICIO_EXTERNO,
                "La consulta a la API del BCRA fue interrumpida",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        } catch (BusinessException e) {
            // Re-lanzar excepciones de negocio
            throw e;
        } catch (Exception e) {
            logger.error("Error inesperado al consultar la API del BCRA: {}", e.getMessage(), e);
            throw new BusinessException(
                ErrorCodes.ERROR_SERVICIO_EXTERNO,
                "Error inesperado al consultar el ICL: " + e.getMessage(),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Calcula el nuevo monto aplicando la tasa de aumento del ICL
     *
     * @param montoOriginal Monto original del alquiler
     * @param fechaInicio Fecha de inicio del período
     * @param fechaFin Fecha de fin del período
     * @return Nuevo monto ajustado por ICL
     */
    public BigDecimal calcularNuevoMontoConICL(BigDecimal montoOriginal, String fechaInicio, String fechaFin) {
        BigDecimal tasaAumento = obtenerTasaAumentoICL(fechaInicio, fechaFin);
        BigDecimal nuevoMonto = montoOriginal.multiply(tasaAumento).setScale(2, RoundingMode.HALF_UP);

        logger.info("Cálculo de nuevo monto - Original: {}, Tasa: {}, Nuevo: {}",
                   montoOriginal, tasaAumento, nuevoMonto);

        return nuevoMonto;
    }
}


