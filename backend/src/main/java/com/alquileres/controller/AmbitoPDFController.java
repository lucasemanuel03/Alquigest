package com.alquileres.controller;

import com.alquileres.model.AmbitoPDF;
import com.alquileres.service.AmbitoPDFService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ambito-pdfs")
public class AmbitoPDFController {

    private final AmbitoPDFService ambitoPDFService;

    public AmbitoPDFController(AmbitoPDFService ambitoPDFService) {
        this.ambitoPDFService = ambitoPDFService;
    }

    @GetMapping
    public ResponseEntity<List<AmbitoPDF>> obtenerTodos() {
        return ResponseEntity.ok(ambitoPDFService.obtenerTodos());
    }

}

