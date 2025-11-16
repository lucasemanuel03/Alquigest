package com.alquileres.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ModificarClaveFiscalRequest {

    @NotBlank(message = "La clave fiscal es obligatoria")
    @Size(max = 500, message = "La clave fiscal no puede exceder 500 caracteres")
    private String claveFiscal;

    public ModificarClaveFiscalRequest() {
    }

    public ModificarClaveFiscalRequest(String claveFiscal) {
        this.claveFiscal = claveFiscal;
    }

    public String getClaveFiscal() {
        return claveFiscal;
    }

    public void setClaveFiscal(String claveFiscal) {
        this.claveFiscal = claveFiscal;
    }
}

