package com.alquileres.controller;

import com.alquileres.service.BackupService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/backup")
public class BackupController {

    private static final Logger logger = LoggerFactory.getLogger(BackupController.class);

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    /**
     * Descarga un backup SQL de la base de datos
     * @return Archivo SQL comprimido
     */
    @GetMapping("/descargar")
    public ResponseEntity<byte[]> descargarBackup() {
        try {
            logger.info("Solicitado descarga de backup SQL");

            // Generar backup
            byte[] backupContent = backupService.generarBackupSQL();

            // Generar nombre del archivo
            String nombreArchivo = backupService.generarNombreArchivo();

            // Configurar headers de respuesta
            HttpHeaders headers = new HttpHeaders();
            headers.setContentDispositionFormData("attachment", nombreArchivo);
            headers.set("Content-Type", "application/sql");

            logger.info("Backup generado exitosamente: {}", nombreArchivo);

            return new ResponseEntity<>(backupContent, headers, HttpStatus.OK);

        } catch (Exception e) {
            logger.error("Error generando backup", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

