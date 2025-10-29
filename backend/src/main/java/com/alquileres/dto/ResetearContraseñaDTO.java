package com.alquileres.dto;

public class ResetearContraseñaDTO {
    private String token;
    private String nuevaContraseña;
    private String confirmarContraseña;

    public ResetearContraseñaDTO() {}

    public ResetearContraseñaDTO(String token, String nuevaContraseña, String confirmarContraseña) {
        this.token = token;
        this.nuevaContraseña = nuevaContraseña;
        this.confirmarContraseña = confirmarContraseña;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getNuevaContraseña() {
        return nuevaContraseña;
    }

    public void setNuevaContraseña(String nuevaContraseña) {
        this.nuevaContraseña = nuevaContraseña;
    }

    public String getConfirmarContraseña() {
        return confirmarContraseña;
    }

    public void setConfirmarContraseña(String confirmarContraseña) {
        this.confirmarContraseña = confirmarContraseña;
    }
}

