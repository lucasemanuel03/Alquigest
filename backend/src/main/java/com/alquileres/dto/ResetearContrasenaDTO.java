package com.alquileres.dto;

public class ResetearContrasenaDTO {
    private String token;
    private String nuevaContrasena;
    private String confirmarContrasena;

    public ResetearContrasenaDTO() {}

    public ResetearContrasenaDTO(String token, String nuevaContrasena, String confirmarContrasena) {
        this.token = token;
        this.nuevaContrasena = nuevaContrasena;
        this.confirmarContrasena = confirmarContrasena;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getNuevaContrasena() {
        return nuevaContrasena;
    }

    public void setNuevaContrasena(String nuevaContrasena) {
        this.nuevaContrasena = nuevaContrasena;
    }

    public String getConfirmarContrasena() {
        return confirmarContrasena;
    }

    public void setConfirmarContrasena(String confirmarContrasena) {
        this.confirmarContrasena = confirmarContrasena;
    }
}

