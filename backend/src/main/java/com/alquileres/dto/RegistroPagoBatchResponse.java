package com.alquileres.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO de respuesta para el registro de pagos en batch
 */
public class RegistroPagoBatchResponse {

    private int totalProcesados;
    private int exitosos;
    private int fallidos;
    private List<ResultadoPagoItem> resultados;

    // Constructor por defecto
    public RegistroPagoBatchResponse() {
        this.resultados = new ArrayList<>();
    }

    public RegistroPagoBatchResponse(int totalProcesados, int exitosos, int fallidos, List<ResultadoPagoItem> resultados) {
        this.totalProcesados = totalProcesados;
        this.exitosos = exitosos;
        this.fallidos = fallidos;
        this.resultados = resultados;
    }

    // Getters y Setters
    public int getTotalProcesados() {
        return totalProcesados;
    }

    public void setTotalProcesados(int totalProcesados) {
        this.totalProcesados = totalProcesados;
    }

    public int getExitosos() {
        return exitosos;
    }

    public void setExitosos(int exitosos) {
        this.exitosos = exitosos;
    }

    public int getFallidos() {
        return fallidos;
    }

    public void setFallidos(int fallidos) {
        this.fallidos = fallidos;
    }

    public List<ResultadoPagoItem> getResultados() {
        return resultados;
    }

    public void setResultados(List<ResultadoPagoItem> resultados) {
        this.resultados = resultados;
    }

    /**
     * Clase interna que representa el resultado de procesar un pago individual
     */
    public static class ResultadoPagoItem {

        private Integer pagoId;
        private boolean exitoso;
        private String mensaje;

        // Constructor por defecto
        public ResultadoPagoItem() {
        }

        public ResultadoPagoItem(Integer pagoId, boolean exitoso, String mensaje) {
            this.pagoId = pagoId;
            this.exitoso = exitoso;
            this.mensaje = mensaje;
        }

        // Getters y Setters
        public Integer getPagoId() {
            return pagoId;
        }

        public void setPagoId(Integer pagoId) {
            this.pagoId = pagoId;
        }

        public boolean isExitoso() {
            return exitoso;
        }

        public void setExitoso(boolean exitoso) {
            this.exitoso = exitoso;
        }

        public String getMensaje() {
            return mensaje;
        }

        public void setMensaje(String mensaje) {
            this.mensaje = mensaje;
        }

        @Override
        public String toString() {
            return "ResultadoPagoItem{" +
                    "pagoId=" + pagoId +
                    ", exitoso=" + exitoso +
                    ", mensaje='" + mensaje + '\'' +
                    '}';
        }
    }

    @Override
    public String toString() {
        return "RegistroPagoBatchResponse{" +
                "totalProcesados=" + totalProcesados +
                ", exitosos=" + exitosos +
                ", fallidos=" + fallidos +
                ", resultados=" + resultados +
                '}';
    }
}

