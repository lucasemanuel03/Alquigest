package com.alquileres.dto;

import jakarta.validation.constraints.NotNull;

public class ActualizarServicioXContratoRequest {

    private String nroCuenta;
    private String nroContratoServicio;

    @NotNull(message = "El campo esDeInquilino es obligatorio")
    private Boolean esDeInquilino;

    @NotNull(message = "El campo esAnual es obligatorio")
    private Boolean esAnual;

    public ActualizarServicioXContratoRequest() {
    }

    public ActualizarServicioXContratoRequest(String nroCuenta, String nroContratoServicio,
                                               Boolean esDeInquilino, Boolean esAnual) {
        this.nroCuenta = nroCuenta;
        this.nroContratoServicio = nroContratoServicio;
        this.esDeInquilino = esDeInquilino;
        this.esAnual = esAnual;
    }

    // Getters y Setters
    public String getNroCuenta() {
        return nroCuenta;
    }

    public void setNroCuenta(String nroCuenta) {
        this.nroCuenta = nroCuenta;
    }

    public String getNroContratoServicio() {
        return nroContratoServicio;
    }

    public void setNroContratoServicio(String nroContratoServicio) {
        this.nroContratoServicio = nroContratoServicio;
    }

    public Boolean getEsDeInquilino() {
        return esDeInquilino;
    }

    public void setEsDeInquilino(Boolean esDeInquilino) {
        this.esDeInquilino = esDeInquilino;
    }

    public Boolean getEsAnual() {
        return esAnual;
    }

    public void setEsAnual(Boolean esAnual) {
        this.esAnual = esAnual;
    }
}

