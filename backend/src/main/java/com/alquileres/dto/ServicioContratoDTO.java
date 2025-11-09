package com.alquileres.dto;

import com.alquileres.model.ServicioContrato;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO para representar un servicio de contrato sin problemas de serialización
 */
public class ServicioContratoDTO {

    private Integer id;
    private Long contratoId;
    private Integer tipoServicioId;
    private String tipoServicioNombre;
    private Boolean esDeInquilino;
    private Boolean esAnual;
    private Boolean esActivo;
    private String nroCuenta;
    private String nroContrato;
    private String nroContratoServicio;
    private LocalDate ultimoPagoGenerado;
    private LocalDate proximoPago;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructor vacío
    public ServicioContratoDTO() {
    }

    // Constructor desde entidad
    public ServicioContratoDTO(ServicioContrato servicio) {
        this.id = servicio.getId();
        this.contratoId = servicio.getContrato() != null ? servicio.getContrato().getId() : null;
        this.tipoServicioId = servicio.getTipoServicio() != null ? servicio.getTipoServicio().getId() : null;
        this.tipoServicioNombre = servicio.getTipoServicio() != null ? servicio.getTipoServicio().getNombre() : null;
        this.esDeInquilino = servicio.getEsDeInquilino();
        this.esAnual = servicio.getEsAnual();
        this.esActivo = servicio.getEsActivo();
        this.nroCuenta = servicio.getNroCuenta();
        this.nroContrato = servicio.getNroContrato();
        this.nroContratoServicio = servicio.getNroContratoServicio();
        this.ultimoPagoGenerado = servicio.getUltimoPagoGenerado();
        this.proximoPago = servicio.getProximoPago();
        this.createdAt = servicio.getCreatedAt();
        this.updatedAt = servicio.getUpdatedAt();
    }

    // Getters y Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Long getContratoId() {
        return contratoId;
    }

    public void setContratoId(Long contratoId) {
        this.contratoId = contratoId;
    }

    public Integer getTipoServicioId() {
        return tipoServicioId;
    }

    public void setTipoServicioId(Integer tipoServicioId) {
        this.tipoServicioId = tipoServicioId;
    }

    public String getTipoServicioNombre() {
        return tipoServicioNombre;
    }

    public void setTipoServicioNombre(String tipoServicioNombre) {
        this.tipoServicioNombre = tipoServicioNombre;
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

    public Boolean getEsActivo() {
        return esActivo;
    }

    public void setEsActivo(Boolean esActivo) {
        this.esActivo = esActivo;
    }

    public String getNroCuenta() {
        return nroCuenta;
    }

    public void setNroCuenta(String nroCuenta) {
        this.nroCuenta = nroCuenta;
    }

    public String getNroContrato() {
        return nroContrato;
    }

    public void setNroContrato(String nroContrato) {
        this.nroContrato = nroContrato;
    }

    public String getNroContratoServicio() {
        return nroContratoServicio;
    }

    public void setNroContratoServicio(String nroContratoServicio) {
        this.nroContratoServicio = nroContratoServicio;
    }

    public LocalDate getUltimoPagoGenerado() {
        return ultimoPagoGenerado;
    }

    public void setUltimoPagoGenerado(LocalDate ultimoPagoGenerado) {
        this.ultimoPagoGenerado = ultimoPagoGenerado;
    }

    public LocalDate getProximoPago() {
        return proximoPago;
    }

    public void setProximoPago(LocalDate proximoPago) {
        this.proximoPago = proximoPago;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

