package com.alquileres.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "contratos")
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @NotNull(message = "El inmueble es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inmueble", nullable = false)
    private Inmueble inmueble;

    @NotNull(message = "El inquilino es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquilino", nullable = false)
    private Inquilino inquilino;

    @Column(name = "fecha_inicio")
    private String fechaInicio;

    @Column(name = "fecha_fin")
    private String fechaFin;

    @Positive(message = "El monto debe ser positivo")
    @Column(precision = 12, scale = 2)
    private BigDecimal monto;

    @PositiveOrZero(message = "El porcentaje de aumento debe ser positivo o cero")
    @Column(name = "porcentaje_aumento", precision = 5, scale = 2)
    private BigDecimal porcentajeAumento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estado", nullable = false)
    private EstadoContrato estadoContrato;

    @Column(name = "aumenta_con_icl", nullable = false)
    private Boolean aumentaConIcl = true;

    @Column(name = "id_pdf")
    private Long idPDF;

    @Column(name = "periodo_aumento")
    private Integer periodoAumento;

    @Column(name = "fecha_aumento")
    private String fechaAumento;

    @Column(name = "created_at")
    private String createdAt;


    // Constructor por defecto
    public Contrato() {
    }

    // Constructor con parámetros principales
    public Contrato(Inmueble inmueble, Inquilino inquilino, String fechaInicio,
                   String fechaFin, BigDecimal monto, EstadoContrato estadoContrato) {
        this.inmueble = inmueble;
        this.inquilino = inquilino;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.monto = monto;
        this.estadoContrato = estadoContrato;
        this.aumentaConIcl = true;
    }

    @PrePersist
    protected void onCreate() {
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        createdAt = now;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Inmueble getInmueble() {
        return inmueble;
    }

    public void setInmueble(Inmueble inmueble) {
        this.inmueble = inmueble;
    }

    public Inquilino getInquilino() {
        return inquilino;
    }

    public void setInquilino(Inquilino inquilino) {
        this.inquilino = inquilino;
    }

    public String getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(String fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public String getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(String fechaFin) {
        this.fechaFin = fechaFin;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public BigDecimal getPorcentajeAumento() {
        return porcentajeAumento;
    }

    public void setPorcentajeAumento(BigDecimal porcentajeAumento) {
        this.porcentajeAumento = porcentajeAumento;
    }

    public EstadoContrato getEstadoContrato() {
        return estadoContrato;
    }

    public void setEstadoContrato(EstadoContrato estadoContrato) {
        this.estadoContrato = estadoContrato;
    }

    public Boolean getAumentaConIcl() {
        return aumentaConIcl;
    }

    public void setAumentaConIcl(Boolean aumentaConIcl) {
        this.aumentaConIcl = aumentaConIcl;
    }

    public Long getIdPDF() {
        return idPDF;
    }

    public void setIdPDF(Long idPDF) {
        this.idPDF = idPDF;
    }

    public Integer getPeriodoAumento() {
        return periodoAumento;
    }

    public void setPeriodoAumento(Integer periodoAumento) {
        this.periodoAumento = periodoAumento;
    }

    public String getFechaAumento() {
        return fechaAumento;
    }

    public void setFechaAumento(String fechaAumento) {
        this.fechaAumento = fechaAumento;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    @Override
    public String toString() {
        return "Contrato{" +
                "id=" + id +
                ", fechaInicio=" + fechaInicio +
                ", fechaFin=" + fechaFin +
                ", monto=" + monto +
                ", aumentaConIcl=" + aumentaConIcl +
                '}';
    }
}
