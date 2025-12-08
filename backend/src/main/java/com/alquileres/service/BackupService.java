package com.alquileres.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class BackupService {

    private static final Logger logger = LoggerFactory.getLogger(BackupService.class);

    private final JdbcTemplate jdbcTemplate;

    public BackupService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Genera un backup SQL de la base de datos usando JDBC
     * @return Contenido del archivo SQL como byte[]
     * @throws Exception Si ocurre un error durante el backup
     */
    public byte[] generarBackupSQL() throws Exception {
        try {
            logger.info("Iniciando backup de base de datos via JDBC");

            StringBuilder backup = new StringBuilder();

            // Header del backup
            backup.append("-- Backup Alquigest\n");
            backup.append("-- Fecha: ").append(LocalDateTime.now()).append("\n");
            backup.append("-- Generado automáticamente\n\n");
            backup.append("SET client_encoding = 'UTF8';\n");
            backup.append("SET standard_conforming_strings = on;\n\n");

            // Obtener todas las tablas del esquema public
            List<String> tablas = jdbcTemplate.queryForList(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
                String.class
            );

            logger.info("Exportando {} tablas", tablas.size());

            // Exportar cada tabla
            for (String tabla : tablas) {
                try {
                    backup.append("\n-- ================================================\n");
                    backup.append("-- Tabla: ").append(tabla).append("\n");
                    backup.append("-- ================================================\n\n");

                    // Obtener datos de la tabla
                    List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM " + tabla);

                    logger.info("Exportando tabla '{}': {} registros", tabla, rows.size());

                    if (!rows.isEmpty()) {
                        // Generar INSERTs
                        for (Map<String, Object> row : rows) {
                            backup.append(generarInsert(tabla, row)).append("\n");
                        }
                    } else {
                        backup.append("-- Tabla vacía\n");
                    }

                } catch (Exception e) {
                    logger.warn("Error exportando tabla '{}': {}", tabla, e.getMessage());
                    backup.append("-- Error exportando tabla: ").append(e.getMessage()).append("\n");
                }
            }

            backup.append("\n-- Backup completado exitosamente\n");

            byte[] backupBytes = backup.toString().getBytes(StandardCharsets.UTF_8);
            logger.info("Backup completado exitosamente. Tamaño: {} bytes", backupBytes.length);

            return backupBytes;

        } catch (Exception e) {
            logger.error("Error generando backup SQL", e);
            throw new Exception("Error al generar el backup: " + e.getMessage(), e);
        }
    }

    /**
     * Genera una sentencia INSERT para una fila
     */
    private String generarInsert(String tabla, Map<String, Object> row) {
        StringBuilder cols = new StringBuilder();
        StringBuilder vals = new StringBuilder();

        boolean first = true;
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            if (!first) {
                cols.append(", ");
                vals.append(", ");
            }

            cols.append(entry.getKey());
            vals.append(formatearValor(entry.getValue()));

            first = false;
        }

        return String.format("INSERT INTO %s (%s) VALUES (%s);", tabla, cols, vals);
    }

    /**
     * Formatea un valor para SQL, manejando nulls, strings, números, booleanos, etc.
     */
    private String formatearValor(Object valor) {
        if (valor == null) {
            return "NULL";
        }

        if (valor instanceof String) {
            // Escapar comillas simples
            String str = ((String) valor).replace("'", "''");
            return "'" + str + "'";
        }

        if (valor instanceof Number || valor instanceof Boolean) {
            return valor.toString();
        }

        if (valor instanceof java.sql.Timestamp || valor instanceof java.sql.Date ||
            valor instanceof java.sql.Time || valor instanceof java.time.LocalDateTime ||
            valor instanceof java.time.LocalDate || valor instanceof java.time.LocalTime) {
            return "'" + valor.toString() + "'";
        }

        // Para otros tipos (arrays, json, etc.)
        String str = valor.toString().replace("'", "''");
        return "'" + str + "'";
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

    /**
     * Carga un backup SQL a la base de datos
     * @param backupContent Contenido del archivo SQL
     * @throws Exception Si ocurre un error durante la restauración
     */
    public void cargarBackupSQL(byte[] backupContent) throws Exception {
        try {
            logger.info("Iniciando carga de backup SQL");

            String backupSQL = new String(backupContent, StandardCharsets.UTF_8);

            // Dividir el archivo en sentencias SQL individuales
            String[] sentencias = backupSQL.split(";");

            int ejecutadas = 0;
            int errores = 0;

            for (String sentencia : sentencias) {
                String sql = sentencia.trim();

                // Ignorar comentarios y líneas vacías
                if (sql.isEmpty() || sql.startsWith("--") || sql.startsWith("SET ")) {
                    continue;
                }

                try {
                    jdbcTemplate.execute(sql);
                    ejecutadas++;
                } catch (Exception e) {
                    errores++;
                    logger.warn("Error ejecutando sentencia SQL: {}. Error: {}",
                        sql.substring(0, Math.min(50, sql.length())), e.getMessage());
                }
            }

            logger.info("Backup cargado. Sentencias ejecutadas: {}, Errores: {}", ejecutadas, errores);

            if (errores > ejecutadas / 2) {
                throw new Exception("Demasiados errores durante la restauración. Ejecutadas: " + ejecutadas + ", Errores: " + errores);
            }

        } catch (Exception e) {
            logger.error("Error cargando backup SQL", e);
            throw new Exception("Error al cargar el backup: " + e.getMessage(), e);
        }
    }
}



