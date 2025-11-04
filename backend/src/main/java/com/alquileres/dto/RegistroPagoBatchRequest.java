package com.alquileres.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * DTO para registrar pagos de servicio en batch (múltiples pagos a la vez)
 */
public class RegistroPagoBatchRequest {

    @NotEmpty(message = "La lista de pagos no puede estar vacía")
    @Valid
    private List<RegistroPagoServicioItem> pagos;

    // Constructor por defecto
    public RegistroPagoBatchRequest() {
    }

    public RegistroPagoBatchRequest(List<RegistroPagoServicioItem> pagos) {
        this.pagos = pagos;
    }

    // Getters y Setters
    public List<RegistroPagoServicioItem> getPagos() {
        return pagos;
    }

    public void setPagos(List<RegistroPagoServicioItem> pagos) {
        this.pagos = pagos;
    }

    /**
     * Clase interna que representa un ítem de pago individual dentro del batch
     */
    public static class RegistroPagoServicioItem {

        @NotNull(message = "El ID del pago es obligatorio")
        private Integer pagoId;

        @Valid
        @NotNull(message = "Los datos del pago son obligatorios")
        private ActualizarPagoServicioRequest datosPago;

        // Constructor por defecto
        public RegistroPagoServicioItem() {
        }

        public RegistroPagoServicioItem(Integer pagoId, ActualizarPagoServicioRequest datosPago) {
            this.pagoId = pagoId;
            this.datosPago = datosPago;
        }

        // Getters y Setters
        public Integer getPagoId() {
            return pagoId;
        }

        public void setPagoId(Integer pagoId) {
            this.pagoId = pagoId;
        }

        public ActualizarPagoServicioRequest getDatosPago() {
            return datosPago;
        }

        public void setDatosPago(ActualizarPagoServicioRequest datosPago) {
            this.datosPago = datosPago;
        }

        @Override
        public String toString() {
            return "RegistroPagoServicioItem{" +
                    "pagoId=" + pagoId +
                    ", datosPago=" + datosPago +
                    '}';
        }
    }

    @Override
    public String toString() {
        return "RegistroPagoBatchRequest{" +
                "pagos=" + pagos +
                '}';
    }
}

