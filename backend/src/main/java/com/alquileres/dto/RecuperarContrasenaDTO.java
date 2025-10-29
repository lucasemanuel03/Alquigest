package com.alquileres.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RecuperarContrasenaDTO {
    @JsonProperty("email")
    private String email;

    public RecuperarContrasenaDTO() {}

    public RecuperarContrasenaDTO(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}

