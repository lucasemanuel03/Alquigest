package com.alquileres.controller;

import com.alquileres.service.BackupService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

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

    /**
     * Carga un backup SQL a la base de datos
     * @param file Archivo SQL del backup
     * @return Respuesta con estado de la operación
     */
    @PostMapping("/cargar")
    public ResponseEntity<Map<String, Object>> cargarBackup(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        try {
            logger.info("Solicitada carga de backup SQL. Archivo: {}, Tamaño: {} bytes",
                file.getOriginalFilename(), file.getSize());

            // Validar archivo
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "El archivo está vacío");
                return ResponseEntity.badRequest().body(response);
            }

            // Validar extensión
            String filename = file.getOriginalFilename();
            if (filename == null || !filename.endsWith(".sql")) {
                response.put("success", false);
                response.put("message", "El archivo debe tener extensión .sql");
                return ResponseEntity.badRequest().body(response);
            }

            // Cargar backup
            byte[] backupContent = file.getBytes();
            backupService.cargarBackupSQL(backupContent);

            logger.info("Backup cargado exitosamente: {}", filename);

            response.put("success", true);
            response.put("message", "Backup restaurado exitosamente");
            response.put("filename", filename);
            response.put("size", file.getSize());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error cargando backup", e);
            response.put("success", false);
            response.put("message", "Error al cargar el backup: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

