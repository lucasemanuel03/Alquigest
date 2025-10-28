package com.alquileres.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Utilidad para manejar conversiones y validaciones de fechas
 */
public class FechaUtil {

    // Formato que espera el usuario: dd/MM/yyyy
    private static final DateTimeFormatter FORMATO_USUARIO = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Formato ISO estándar para la base de datos: yyyy-MM-dd
    private static final DateTimeFormatter FORMATO_ISO_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // Formato ISO con tiempo para la base de datos: yyyy-MM-ddTHH:mm:ss
    private static final DateTimeFormatter FORMATO_ISO_DATETIME = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    /**
     * Convierte una fecha del formato del usuario (dd/MM/yyyy) al formato ISO con tiempo (yyyy-MM-ddTHH:mm:ss)
     *
     * @param fechaUsuario Fecha en formato dd/MM/yyyy
     * @return Fecha en formato yyyy-MM-ddTHH:mm:ss, o null si la fecha es null o inválida
     */
    public static String convertirFechaUsuarioToISO(String fechaUsuario) {
        if (fechaUsuario == null || fechaUsuario.trim().isEmpty()) {
            return null;
        }

        try {
            LocalDate fecha = LocalDate.parse(fechaUsuario.trim(), FORMATO_USUARIO);
            LocalDateTime fechaConTiempo = fecha.atTime(0, 0, 0);
            return fechaConTiempo.format(FORMATO_ISO_DATETIME);
        } catch (DateTimeParseException e) {
            // Si no puede parsear con formato usuario, intenta con formato ISO
            try {
                LocalDate fecha = LocalDate.parse(fechaUsuario.trim());
                LocalDateTime fechaConTiempo = fecha.atTime(0, 0, 0);
                return fechaConTiempo.format(FORMATO_ISO_DATETIME);
            } catch (DateTimeParseException e2) {
                throw new IllegalArgumentException("Formato de fecha inválido. Use dd/MM/yyyy (ej: 25/12/2024)", e);
            }
        }
    }

    /**
     * Convierte una fecha del formato del usuario (dd/MM/yyyy) al formato ISO sin hora (yyyy-MM-dd)
     *
     * @param fechaUsuario Fecha en formato dd/MM/yyyy
     * @return Fecha en formato yyyy-MM-dd, o null si la fecha es null o inválida
     */
    public static String convertirFechaUsuarioToISODate(String fechaUsuario) {
        if (fechaUsuario == null || fechaUsuario.trim().isEmpty()) {
            return null;
        }

        try {
            LocalDate fecha = LocalDate.parse(fechaUsuario.trim(), FORMATO_USUARIO);
            return fecha.format(FORMATO_ISO_DATE);
        } catch (DateTimeParseException e) {
            // Si no puede parsear con formato usuario, intenta con formato ISO
            try {
                LocalDate fecha = LocalDate.parse(fechaUsuario.trim());
                return fecha.format(FORMATO_ISO_DATE);
            } catch (DateTimeParseException e2) {
                throw new IllegalArgumentException("Formato de fecha inválido. Use dd/MM/yyyy (ej: 25/12/2024)", e);
            }
        }
    }

    /**
     * Convierte una fecha del formato del usuario (dd/MM/yyyy) al formato ISO con tiempo
     *
     * @param fechaUsuario Fecha en formato dd/MM/yyyy
     * @return Fecha en formato yyyy-MM-ddTHH:mm:ss, o null si la fecha es null o inválida
     */
    public static String convertirFechaUsuarioToISODateTime(String fechaUsuario) {
        if (fechaUsuario == null || fechaUsuario.trim().isEmpty()) {
            return null;
        }

        try {
            LocalDate fecha = LocalDate.parse(fechaUsuario.trim(), FORMATO_USUARIO);
            LocalDateTime fechaConTiempo = fecha.atTime(0, 0, 0);
            return fechaConTiempo.format(FORMATO_ISO_DATETIME);
        } catch (DateTimeParseException e) {
            // Si no puede parsear con formato usuario, intenta con formato ISO
            try {
                LocalDate fecha = LocalDate.parse(fechaUsuario.trim());
                LocalDateTime fechaConTiempo = fecha.atTime(0, 0, 0);
                return fechaConTiempo.format(FORMATO_ISO_DATETIME);
            } catch (DateTimeParseException e2) {
                throw new IllegalArgumentException("Formato de fecha inválido. Use dd/MM/yyyy (ej: 25/12/2024)", e);
            }
        }
    }

    /**
     * Convierte una fecha ISO (yyyy-MM-dd) al formato del usuario (dd/MM/yyyy)
     *
     * @param fechaISO Fecha en formato ISO
     * @return Fecha en formato dd/MM/yyyy, o null si la fecha es null o inválida
     */
    public static String convertirFechaISOToUsuario(String fechaISO) {
        if (fechaISO == null || fechaISO.trim().isEmpty()) {
            return null;
        }

        try {
            // Intenta parsear como fecha completa con tiempo
            if (fechaISO.contains("T")) {
                LocalDateTime fechaConTiempo = LocalDateTime.parse(fechaISO.trim(), FORMATO_ISO_DATETIME);
                return fechaConTiempo.toLocalDate().format(FORMATO_USUARIO);
            } else {
                // Parsea como fecha simple
                LocalDate fecha = LocalDate.parse(fechaISO.trim(), FORMATO_ISO_DATE);
                return fecha.format(FORMATO_USUARIO);
            }
        } catch (DateTimeParseException e) {
            return fechaISO; // Devuelve la fecha original si no puede convertir
        }
    }

    /**
     * Valida si una fecha está en formato dd/MM/yyyy
     *
     * @param fecha Fecha a validar
     * @return true si es válida, false en caso contrario
     */
    public static boolean esFechaValidaUsuario(String fecha) {
        if (fecha == null || fecha.trim().isEmpty()) {
            return true; // null o vacío se considera válido (campo opcional)
        }

        try {
            LocalDate.parse(fecha.trim(), FORMATO_USUARIO);
            return true;
        } catch (DateTimeParseException e) {
            return false;
        }
    }

    /**
     * Calcula una fecha agregando meses a una fecha base
     *
     * @param fechaBase Fecha base en formato ISO (yyyy-MM-ddTHH:mm:ss)
     * @param meses Cantidad de meses a agregar
     * @return Nueva fecha en formato ISO con tiempo, o null si la fecha base es null
     */
    public static String agregarMeses(String fechaBase, int meses) {
        if (fechaBase == null || fechaBase.trim().isEmpty()) {
            return null;
        }

        try {
            LocalDateTime fechaDateTime;
            if (fechaBase.contains("T")) {
                fechaDateTime = LocalDateTime.parse(fechaBase.trim(), FORMATO_ISO_DATETIME);
            } else {
                LocalDate fecha = LocalDate.parse(fechaBase.trim(), FORMATO_ISO_DATE);
                fechaDateTime = fecha.atTime(0, 0, 0);
            }
            LocalDateTime nuevaFecha = fechaDateTime.plusMonths(meses);
            return nuevaFecha.format(FORMATO_ISO_DATETIME);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Formato de fecha inválido para cálculo: " + fechaBase, e);
        }
    }

    /**
     * Calcula una fecha agregando meses a una fecha base (sin hora)
     *
     * @param fechaBase Fecha base en formato ISO (yyyy-MM-dd)
     * @param meses Cantidad de meses a agregar
     * @return Nueva fecha en formato ISO sin hora (yyyy-MM-dd), o null si la fecha base es null
     */
    public static String agregarMesesDate(String fechaBase, int meses) {
        if (fechaBase == null || fechaBase.trim().isEmpty()) {
            return null;
        }

        try {
            LocalDate fecha;
            if (fechaBase.contains("T")) {
                LocalDateTime fechaDateTime = LocalDateTime.parse(fechaBase.trim(), FORMATO_ISO_DATETIME);
                fecha = fechaDateTime.toLocalDate();
            } else {
                fecha = LocalDate.parse(fechaBase.trim(), FORMATO_ISO_DATE);
            }
            LocalDate nuevaFecha = fecha.plusMonths(meses);
            return nuevaFecha.format(FORMATO_ISO_DATE);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Formato de fecha inválido para cálculo: " + fechaBase, e);
        }
    }

    /**
     * Compara dos fechas en formato ISO
     *
     * @param fecha1 Primera fecha en formato ISO
     * @param fecha2 Segunda fecha en formato ISO
     * @return Negativo si fecha1 < fecha2, 0 si son iguales, positivo si fecha1 > fecha2
     */
    public static int compararFechas(String fecha1, String fecha2) {
        if (fecha1 == null && fecha2 == null) return 0;
        if (fecha1 == null) return -1;
        if (fecha2 == null) return 1;

        try {
            LocalDateTime f1, f2;

            // Parsear fecha1
            if (fecha1.contains("T")) {
                f1 = LocalDateTime.parse(fecha1.trim(), FORMATO_ISO_DATETIME);
            } else {
                LocalDate fechaDate1 = LocalDate.parse(fecha1.trim(), FORMATO_ISO_DATE);
                f1 = fechaDate1.atTime(0, 0, 0);
            }

            // Parsear fecha2
            if (fecha2.contains("T")) {
                f2 = LocalDateTime.parse(fecha2.trim(), FORMATO_ISO_DATETIME);
            } else {
                LocalDate fechaDate2 = LocalDate.parse(fecha2.trim(), FORMATO_ISO_DATE);
                f2 = fechaDate2.atTime(0, 0, 0);
            }

            return f1.compareTo(f2);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Error comparando fechas: " + fecha1 + " y " + fecha2, e);
        }
    }
}
