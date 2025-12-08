package com.alquileres.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.io.ByteArrayOutputStream;

@Service
public class BackupService {

    private static final Logger logger = LoggerFactory.getLogger(BackupService.class);

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    /**
     * Genera un backup SQL de la base de datos
     * @return Contenido del archivo SQL como byte[]
     * @throws Exception Si ocurre un error durante el backup
     */
    public byte[] generarBackupSQL() throws Exception {
        try {
            // Extraer host, puerto y nombre de base de datos de la URL
            // Formato esperado: jdbc:postgresql://host:port/database?user=xxx&...
            String[] urlParts = dbUrl.split("://")[1].split("/");
            String hostPort = urlParts[0];
            String[] hostPortParts = hostPort.split(":");
            String host = hostPortParts[0];
            String port = hostPortParts.length > 1 ? hostPortParts[1] : "5432";
            String database = urlParts[1].split("\\?")[0];

            logger.info("Iniciando backup de base de datos: {}@{}:{}/{}", dbUsername, host, port, database);

            // Construir comando pg_dump con compatibilidad de versiones
            ProcessBuilder processBuilder = new ProcessBuilder(
                "pg_dump",
                "-h", host,
                "-p", port,
                "-U", dbUsername,
                "-d", database,
                "--no-password",
                "--no-sync"  // Evita problemas de sincronización de versiones
            );

            // Configurar variable de entorno para la contraseña
            processBuilder.environment().put("PGPASSWORD", dbPassword);

            // Ejecutar proceso
            Process process = processBuilder.start();

            // Leer salida del proceso
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = process.getInputStream().read(buffer)) != -1) {
                output.write(buffer, 0, bytesRead);
            }

            // Leer errores si los hay
            BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
            StringBuilder errorOutput = new StringBuilder();
            String line;
            while ((line = errorReader.readLine()) != null) {
                errorOutput.append(line).append("\n");
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                // Algunos errores de versión pueden ser ignorados si el backup se generó
                String errorMsg = errorOutput.toString();
                if (output.size() > 0 && errorMsg.contains("version mismatch")) {
                    logger.warn("Backup generado con advertencia de versión (expected): {}", errorMsg);
                } else {
                    logger.error("Error en pg_dump. Exit code: {}. Error: {}", exitCode, errorMsg);
                    throw new Exception("Error durante el backup: " + errorMsg);
                }
            }

            logger.info("Backup completado exitosamente. Tamaño: {} bytes", output.size());
            return output.toByteArray();

        } catch (Exception e) {
            logger.error("Error generando backup SQL", e);
            throw new Exception("Error al generar el backup: " + e.getMessage(), e);
        }
    }

    /**
     * Genera el nombre del archivo de backup con formato: dd-MM-yyyy--hh-mm-Backup-Alquigest.sql
     * @return Nombre del archivo
     */
    public String generarNombreArchivo() {
        LocalDateTime ahora = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy--HH-mm");
        return ahora.format(formatter) + "-Backup-Alquigest.sql";
    }
}

