package com.alquileres.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RecuperarContraseñaDTO {
    @JsonProperty("email")
    private String email;

    public RecuperarContraseñaDTO() {}

    public RecuperarContraseñaDTO(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}

