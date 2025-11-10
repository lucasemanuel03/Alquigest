package com.alquileres.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entidad fusionada que combina ServicioXContrato y ConfiguracionPagoServicio.
 * Representa un servicio asociado a un contrato y gestiona la generación automática de pagos.
 */
@Entity
@Table(name = "servicio_contrato")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ServicioContrato {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    // ==================== DATOS DEL SERVICIO ====================

    @NotNull(message = "El contrato es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contrato_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "servicios", "alquileres"})
    private Contrato contrato;

    @NotNull(message = "El tipo de servicio es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_servicio_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private TipoServicio tipoServicio;

    @Column(name = "es_de_inquilino", nullable = false)
    private Boolean esDeInquilino = false;

    @Column(name = "es_anual", nullable = false)
    private Boolean esAnual = false;

    @Column(name = "es_activo", nullable = false)
    private Boolean esActivo = true;

    // ==================== DATOS ADMINISTRATIVOS (OPCIONAL) ====================

    @Column(name = "nro_cuenta", length = 50)
    private String nroCuenta;

    @Column(name = "nro_contrato", length = 50)
    private String nroContrato;

    @Column(name = "nro_contrato_servicio", length = 50)
    private String nroContratoServicio;

    // ==================== CONTROL DE GENERACIÓN DE PAGOS ====================

    @Column(name = "ultimo_pago_generado")
    private LocalDate ultimoPagoGenerado;

    @Column(name = "proximo_pago")
    private LocalDate proximoPago;

    // ==================== AUDITORÍA ====================

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ==================== CONSTRUCTORES ====================

    public ServicioContrato() {
    }

    public ServicioContrato(Contrato contrato, TipoServicio tipoServicio) {
        this.contrato = contrato;
        this.tipoServicio = tipoServicio;
        this.esDeInquilino = false;
        this.esAnual = false;
        this.esActivo = true;
    }

    public ServicioContrato(Contrato contrato, TipoServicio tipoServicio, String nroCuenta, String nroContrato,
                            String nroContratoServicio, Boolean esDeInquilino, Boolean esAnual) {
        this.contrato = contrato;
        this.tipoServicio = tipoServicio;
        this.nroCuenta = nroCuenta;
        this.nroContrato = nroContrato;
        this.nroContratoServicio = nroContratoServicio;
        this.esDeInquilino = esDeInquilino != null ? esDeInquilino : false;
        this.esAnual = esAnual != null ? esAnual : false;
        this.esActivo = true;
    }

    // ==================== LIFECYCLE CALLBACKS ====================

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ==================== GETTERS Y SETTERS ====================

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

    @Override
    public String toString() {
        return "ServicioContrato{" +
                "id=" + id +
                ", contratoId=" + (contrato != null ? contrato.getId() : null) +
                ", tipoServicioId=" + (tipoServicio != null ? tipoServicio.getId() : null) +
                ", esDeInquilino=" + esDeInquilino +
                ", esAnual=" + esAnual +
                ", esActivo=" + esActivo +
                ", ultimoPagoGenerado=" + ultimoPagoGenerado +
                ", proximoPago=" + proximoPago +
                '}';
    }
}

