package com.alquileres.dto;

import java.math.BigDecimal;

public class AlquilerDetalladoDTO {
    private Long alquilerId;
    private String propietarioApellido;
    private String propietarioNombre;
    private String inmuebleDireccion;
    private BigDecimal montoAlquiler;
    private Boolean estaPagado;
    private BigDecimal honorarios;

    public AlquilerDetalladoDTO() {}

    public AlquilerDetalladoDTO(Long alquilerId, String propietarioApellido, String propietarioNombre,
                                String inmuebleDireccion, BigDecimal montoAlquiler, Boolean estaPagado,
                                BigDecimal honorarios) {
        this.alquilerId = alquilerId;
        this.propietarioApellido = propietarioApellido;
        this.propietarioNombre = propietarioNombre;
        this.inmuebleDireccion = inmuebleDireccion;
        this.montoAlquiler = montoAlquiler;
        this.estaPagado = estaPagado;
        this.honorarios = honorarios;
    }

    public Long getAlquilerId() {
        return alquilerId;
    }

    public void setAlquilerId(Long alquilerId) {
        this.alquilerId = alquilerId;
    }

    public String getPropietarioApellido() {
        return propietarioApellido;
    }

    public void setPropietarioApellido(String propietarioApellido) {
        this.propietarioApellido = propietarioApellido;
    }

    public String getPropietarioNombre() {
        return propietarioNombre;
    }

    public void setPropietarioNombre(String propietarioNombre) {
        this.propietarioNombre = propietarioNombre;
    }

    public String getInmuebleDireccion() {
        return inmuebleDireccion;
    }

    public void setInmuebleDireccion(String inmuebleDireccion) {
        this.inmuebleDireccion = inmuebleDireccion;
    }

    public BigDecimal getMontoAlquiler() {
        return montoAlquiler;
    }

    public void setMontoAlquiler(BigDecimal montoAlquiler) {
        this.montoAlquiler = montoAlquiler;
    }

    public Boolean getEstaPagado() {
        return estaPagado;
    }

    public void setEstaPagado(Boolean estaPagado) {
        this.estaPagado = estaPagado;
    }

    public BigDecimal getHonorarios() {
        return honorarios;
    }

    public void setHonorarios(BigDecimal honorarios) {
        this.honorarios = honorarios;
    }
}

