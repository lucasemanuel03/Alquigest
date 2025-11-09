package com.alquileres.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "pago_servicio")
public class PagoServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @NotNull(message = "El servicio contrato es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "servicio_contrato_id", nullable = false)
    private ServicioContrato servicioContrato;

    @Pattern(regexp = "^(0[1-9]|1[0-2])/\\d{4}$", message = "El periodo debe tener el formato mm/aaaa (ej: 01/2025)")
    @Column(name = "periodo", length = 7)
    private String periodo; // Formato: mm/aaaa (ej: 01/2025) - representa el mes/ano de la factura

    @Column(name = "fecha_pago")
    private String fechaPago;

    @Column(name = "esta_pagado", nullable = false)
    private Boolean estaPagado = false;

    @Column(name = "esta_vencido", nullable = false)
    private Boolean estaVencido = false;

    @Column(name = "pdf_path", length = 500)
    private String pdfPath;

    @Column(name = "medio_pago", length = 50)
    private String medioPago;

    @PositiveOrZero(message = "El monto debe ser positivo o cero")
    @Column(name = "monto", precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(name = "created_at")
    private String createdAt;

    @Column(name = "updated_at")
    private String updatedAt;

    // Constructor por defecto
    public PagoServicio() {
    }

    // Constructor con parámetros principales
    public PagoServicio(ServicioContrato servicioContrato, String periodo, String fechaVencimiento, BigDecimal monto) {
        this.servicioContrato = servicioContrato;
        this.periodo = periodo;
        this.monto = monto;
        this.estaPagado = false;
        this.estaVencido = false;
    }

    @PrePersist
    protected void onCreate() {
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }

    // Getters y Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public ServicioContrato getServicioContrato() {
        return servicioContrato;
    }

    public void setServicioContrato(ServicioContrato servicioContrato) {
        this.servicioContrato = servicioContrato;
    }

    public String getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(String fechaPago) {
        this.fechaPago = fechaPago;
    }

    public Boolean getEstaPagado() {
        return estaPagado;
    }

    public void setEstaPagado(Boolean estaPagado) {
        this.estaPagado = estaPagado;
    }

    public Boolean getEstaVencido() {
        return estaVencido;
    }

    public void setEstaVencido(Boolean estaVencido) {
        this.estaVencido = estaVencido;
    }

    public String getPdfPath() {
        return pdfPath;
    }

    public void setPdfPath(String pdfPath) {
        this.pdfPath = pdfPath;
    }

    public String getMedioPago() {
        return medioPago;
    }

    public void setMedioPago(String medioPago) {
        this.medioPago = medioPago;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getPeriodo() {
        return periodo;
    }

    public void setPeriodo(String periodo) {
        this.periodo = periodo;
    }

    @Override
    public String toString() {
        return "PagoServicio{" +
                "id=" + id +
                ", periodo='" + periodo + '\'' +
                ", fechaPago='" + fechaPago + '\'' +
                ", estaPagado=" + estaPagado +
                ", estaVencido=" + estaVencido +
                ", medioPago='" + medioPago + '\'' +
                ", monto=" + monto +
                '}';
    }
}
