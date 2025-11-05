package com.alquileres.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "servicio_x_contrato")
public class ServicioXContrato {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    // Contrato de alquiler asociado al servicio
    @NotNull(message = "El contrato es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contrato_id", nullable = false)
    private Contrato contrato;

    @NotNull(message = "El tipo de servicio es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_servicio_id", nullable = false)
    private TipoServicio tipoServicio;

    // Número de cuenta asociado al servicio
    @Column(name = "nro_cuenta", length = 50, nullable = false)
    private String nroCuenta;

    // String del numero de contrato de alquiler (por alguna razón)
    @Column(name = "nro_contrato", length = 50, nullable = false)
    private String nroContrato;

    // Número de contrato del servicio (solo para Luz)
    @Column(name = "nro_contrato_servicio", length = 50)
    private String nroContratoServicio;

    @Column(name = "es_de_inquilino", nullable = false)
    private Boolean esDeInquilino = false;

    @Column(name = "es_anual", nullable = false)
    private Boolean esAnual = false;

    @Column(name = "es_activo", nullable = false)
    private Boolean esActivo = true;

    @Column(name = "created_at")
    private String createdAt;

    @Column(name = "updated_at")
    private String updatedAt;

    // Constructor por defecto
    public ServicioXContrato() {
    }

    // Constructor con parámetros principales
    public ServicioXContrato(Contrato contrato, TipoServicio tipoServicio) {
        this.contrato = contrato;
        this.tipoServicio = tipoServicio;
        this.esDeInquilino = false;
        this.esAnual = false;
        this.esActivo = true;
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

    public Contrato getContrato() {
        return contrato;
    }

    public void setContrato(Contrato contrato) {
        this.contrato = contrato;
    }

    public TipoServicio getTipoServicio() {
        return tipoServicio;
    }

    public void setTipoServicio(TipoServicio tipoServicio) {
        this.tipoServicio = tipoServicio;
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

    @Override
    public String toString() {
        return "ServicioXContrato{" +
                "id=" + id +
                ", contratoId=" + (contrato != null ? contrato.getId() : null) +
                ", tipoServicioId=" + (tipoServicio != null ? tipoServicio.getId() : null) +
                ", nroCuenta='" + nroCuenta + '\'' +
                ", nroContrato='" + nroContrato + '\'' +
                ", nroContratoServicio='" + nroContratoServicio + '\'' +
                ", esDeInquilino=" + esDeInquilino +
                ", esAnual=" + esAnual +
                ", esActivo=" + esActivo +
                '}';
    }
}

