package com.alquileres.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "configuracion_pago_servicio")
public class ConfiguracionPagoServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;

    @NotNull(message = "El servicio contrato es obligatorio")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "servicio_contrato_id", nullable = false, unique = true)
    private ServicioContrato servicioContrato;

    @Column(name = "fecha_inicio")
    private String fechaInicio; // Fecha de inicio del servicio en formato ISO

    @Column(name = "fecha_fin")
    private String fechaFin; // Fecha de fin del servicio (si aplica)

    @Column(name = "ultimo_pago_generado")
    private String ultimoPagoGenerado; // Última fecha para la que se generó un pago

    @Column(name = "proximo_pago")
    private String proximoPago; // Fecha del próximo pago a generar

    @Column(name = "es_activo", nullable = false)
    private Boolean esActivo = true;

    @Column(name = "created_at")
    private String createdAt;

    @Column(name = "updated_at")
    private String updatedAt;

    // Constructor por defecto
    public ConfiguracionPagoServicio() {
    }

    // Constructor con parámetros principales
    public ConfiguracionPagoServicio(ServicioContrato servicioContrato, String fechaInicio) {
        this.servicioContrato = servicioContrato;
        this.fechaInicio = fechaInicio;
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

    public ServicioContrato getServicioContrato() {
        return servicioContrato;
    }

    public void setServicioContrato(ServicioContrato servicioContrato) {
        this.servicioContrato = servicioContrato;
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

    public String getUltimoPagoGenerado() {
        return ultimoPagoGenerado;
    }

    public void setUltimoPagoGenerado(String ultimoPagoGenerado) {
        this.ultimoPagoGenerado = ultimoPagoGenerado;
    }

    public String getProximoPago() {
        return proximoPago;
    }

    public void setProximoPago(String proximoPago) {
        this.proximoPago = proximoPago;
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
        return "ConfiguracionPagoServicio{" +
                "id=" + id +
                ", servicioContratoId=" + (servicioContrato != null ? servicioContrato.getId() : null) +
                ", fechaInicio='" + fechaInicio + '\'' +
                ", fechaFin='" + fechaFin + '\'' +
                ", ultimoPagoGenerado='" + ultimoPagoGenerado + '\'' +
                ", proximoPago='" + proximoPago + '\'' +
                ", esActivo=" + esActivo +
                '}';
    }
}
